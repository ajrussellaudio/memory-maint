/**
 * Alternative LLM interface using OpenClaw's native capabilities
 * This avoids needing external CLI tools configured
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Call LLM using OpenClaw's sessions_spawn
 * This requires running from within an OpenClaw agent session
 * @param {string} promptFile - Path to prompt template  
 * @param {Object} variables - Variables to inject into prompt
 * @returns {Promise<string>} - LLM response
 */
async function callLLMViaSpawn(promptFile, variables = {}) {
  // Load prompt template
  const promptTemplate = await fs.readFile(promptFile, 'utf8');
  
  // Replace variables
  let prompt = promptTemplate;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  
  // Write to temp file for the agent to read
  const tempPrompt = path.join('/tmp', `memory-maint-prompt-${Date.now()}.txt`);
  await fs.writeFile(tempPrompt, prompt, 'utf8');
  
  console.log('\n' + '='.repeat(80));
  console.log('LLM PROMPT READY');
  console.log('='.repeat(80));
  console.log(`Prompt saved to: ${tempPrompt}`);
  console.log('\nPlease analyze the prompt and respond with JSON as specified.');
  console.log('Your response will be parsed and used to generate the memory review.');
  console.log('='.repeat(80) + '\n');
  
  // In a real implementation, this would spawn a sub-agent
  // For now, we'll just throw an error with instructions
  throw new Error(
    'LLM integration not yet implemented for OpenClaw native mode.\n\n' +
    'Please use one of these options:\n' +
    '1. Configure gemini CLI and set llmCommand: "gemini" in config.json\n' +
    '2. Create a custom LLM wrapper script and set llmCommand: "path/to/script"\n' +
    '3. Set GEMINI_API_KEY environment variable and use gemini CLI\n\n' +
    `Prompt is available at: ${tempPrompt}`
  );
}

module.exports = {
  callLLMViaSpawn
};
