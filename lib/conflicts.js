/**
 * Conflict detection module
 * Identifies potential contradictions in recent work
 */

const fs = require('fs').promises;
const path = require('path');
const { parseJSONResponse } = require('./llm');

/**
 * Detect conflicts in daily logs
 * 
 * @param {Object} options - Detection options
 * @param {number} options.days - Number of days to analyze
 * @param {Array} options.dailyLogs - Array of daily log objects
 * @param {string} options.skillPath - Path to skill directory
 * @param {Function} options.sessions_spawn - OpenClaw sessions_spawn function
 * @param {Function} options.logger - Optional logging function
 * @returns {Promise<Object>} - Result with conflicts array
 */
async function detectConflicts({ days, dailyLogs, skillPath, sessions_spawn, logger = console.log }) {
  logger('🔍 Analyzing for potential conflicts...\n');
  
  if (dailyLogs.length === 0) {
    return { success: true, conflicts: [] };
  }
  
  // Format logs for LLM
  const logsText = dailyLogs.map(log => {
    return `## ${log.date}\n${log.content}`;
  }).join('\n\n---\n\n');
  
  // Load conflict detection prompt
  const promptPath = path.join(skillPath, 'prompts', 'conflicts.txt');
  const promptTemplate = await fs.readFile(promptPath, 'utf8');
  
  // Replace variables
  const prompt = promptTemplate
    .replace(/\{\{daysCount\}\}/g, days)
    .replace(/\{\{dailyLogs\}\}/g, logsText);
  
  // Call LLM via sub-agent
  const result = await sessions_spawn({
    runtime: "subagent",
    mode: "run",
    task: prompt,
    runTimeoutSeconds: 90
  });
  
  if (!result || !result.response) {
    throw new Error('Sub-agent did not return a valid response');
  }
  
  // Parse response
  const detected = parseJSONResponse(result.response);
  
  if (!detected.conflicts || detected.conflicts.length === 0) {
    logger('✓ No conflicts detected\n');
    return { success: true, conflicts: [] };
  }
  
  logger(`⚠️  Found ${detected.conflicts.length} potential conflict(s)\n`);
  
  // Format conflicts for display
  detected.conflicts.forEach((conflict, index) => {
    logger(`${index + 1}. ${conflict.summary}`);
    logger(`   Type: ${conflict.type}`);
    logger(`   Severity: ${conflict.severity}`);
    logger(`   First: ${conflict.item1.summary} (${conflict.item1.date || 'unknown date'})`);
    logger(`   Later: ${conflict.item2.summary} (${conflict.item2.date || 'unknown date'})`);
    logger(`   Question: ${conflict.question}\n`);
  });
  
  return {
    success: true,
    conflicts: detected.conflicts
  };
}

/**
 * Format conflicts as markdown for review
 * 
 * @param {Array} conflicts - Array of conflict objects
 * @returns {string} - Formatted markdown
 */
function formatConflictsMarkdown(conflicts) {
  if (conflicts.length === 0) {
    return '# Conflict Detection\n\n✓ No conflicts detected in recent logs.\n';
  }
  
  let markdown = '# Conflict Detection\n\n';
  markdown += `Found ${conflicts.length} potential conflict(s) that may need clarification:\n\n`;
  markdown += '---\n\n';
  
  conflicts.forEach((conflict, index) => {
    const severity = conflict.severity === 'high' ? '🔴' : 
                     conflict.severity === 'medium' ? '🟡' : '🟢';
    
    markdown += `## ${index + 1}. ${conflict.summary} ${severity}\n\n`;
    markdown += `**Type:** ${conflict.type.replace(/_/g, ' ')}\n\n`;
    markdown += `**First action:**\n`;
    markdown += `- ${conflict.item1.summary}\n`;
    markdown += `- Date: ${conflict.item1.date || 'unknown'}\n`;
    if (conflict.item1.context) {
      markdown += `- Context: ${conflict.item1.context}\n`;
    }
    markdown += '\n';
    
    markdown += `**Later action:**\n`;
    markdown += `- ${conflict.item2.summary}\n`;
    markdown += `- Date: ${conflict.item2.date || 'unknown'}\n`;
    if (conflict.item2.context) {
      markdown += `- Context: ${conflict.item2.context}\n`;
    }
    markdown += '\n';
    
    markdown += `**Question to resolve:**\n`;
    markdown += `> ${conflict.question}\n\n`;
    markdown += '---\n\n';
  });
  
  markdown += '## What to Do\n\n';
  markdown += 'Review each conflict and decide:\n';
  markdown += '1. Is this actually a conflict, or just evolution/refinement?\n';
  markdown += '2. If it\'s a real conflict, which action should take precedence?\n';
  markdown += '3. Update MEMORY.md or daily logs to clarify the resolution\n';
  
  return markdown;
}

module.exports = {
  detectConflicts,
  formatConflictsMarkdown
};
