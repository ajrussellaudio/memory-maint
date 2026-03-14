/**
 * LLM interface for memory-maint skill
 * Uses OpenClaw's sessions_spawn to call LLM via sub-agent
 * No external dependencies or API keys needed
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Call LLM with a prompt using OpenClaw's sessions_spawn
 * This is only available when running inside an OpenClaw agent session
 * @param {string} promptFile - Path to prompt template file
 * @param {Object} variables - Variables to inject into prompt
 * @param {Function} sessions_spawn - OpenClaw sessions_spawn function (injected)
 * @returns {Promise<string>} - LLM response
 */
async function callLLM(promptFile, variables = {}, sessions_spawn = null) {
  // Load prompt template
  const promptTemplate = await fs.readFile(promptFile, 'utf8');
  
  // Replace variables in template
  let prompt = promptTemplate;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  
  // If sessions_spawn is not available, we need to be called from OpenClaw
  if (!sessions_spawn) {
    throw new Error(
      'This tool must be run from within an OpenClaw agent session.\n' +
      'The sessions_spawn function is required but was not provided.\n\n' +
      'Usage from agent:\n' +
      '  const result = await callLLM(promptFile, variables, sessions_spawn);'
    );
  }
  
  // Spawn a sub-agent to process the prompt
  // Using mode: "run" for one-shot execution
  const result = await sessions_spawn({
    runtime: "subagent",
    mode: "run",
    task: prompt,
    runTimeoutSeconds: 120 // 2 minutes should be plenty for analysis
  });
  
  // Extract the response from the sub-agent result
  // The result will contain the agent's response
  if (!result || !result.response) {
    throw new Error('Sub-agent did not return a valid response');
  }
  
  return result.response.trim();
}

/**
 * Parse JSON from LLM response (handles markdown code blocks)
 * @param {string} response - Raw LLM response
 * @returns {Object} - Parsed JSON object
 */
function parseJSONResponse(response) {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = response.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : response;
  
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    throw new Error(`Failed to parse LLM response as JSON: ${error.message}\n\nResponse:\n${response}`);
  }
}

module.exports = {
  callLLM,
  parseJSONResponse
};
