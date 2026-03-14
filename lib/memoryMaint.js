/**
 * Memory Maintenance - Core module for OpenClaw agents
 * 
 * This module provides functions that OpenClaw agents can call directly,
 * using their built-in sessions_spawn capability for LLM analysis.
 */

const fs = require('fs').promises;
const path = require('path');
const { readMemoryFile, readDailyLogs, getMemoryFilePath, getReviewOutputPath } = require('./fileReader');
const { parseJSONResponse } = require('./llm');
const { generateReviewFile, applyReview } = require('./writer');

/**
 * Load configuration from config.json
 * @param {string} skillPath - Path to the memory-maint skill directory
 * @returns {Promise<Object>} - Configuration object
 */
async function loadConfig(skillPath) {
  const configPath = path.join(skillPath, 'config.json');
  const configData = await fs.readFile(configPath, 'utf8');
  return JSON.parse(configData);
}

/**
 * Run memory review analysis
 * 
 * @param {Object} options - Review options
 * @param {number} options.days - Number of days to analyze (default: 7)
 * @param {string} options.skillPath - Path to memory-maint skill directory
 * @param {Function} options.sessions_spawn - OpenClaw sessions_spawn function
 * @param {Function} options.logger - Optional logging function (default: console.log)
 * @returns {Promise<Object>} - Result object with extracted data and paths
 */
async function runReview({ days = 7, skillPath, sessions_spawn, logger = console.log }) {
  logger('📝 Memory Maintenance - Review\n');
  logger(`Analyzing last ${days} days of logs...\n`);
  
  // Load config
  const config = await loadConfig(skillPath);
  
  // Read memory files
  const memoryContent = await readMemoryFile(config);
  const dailyLogs = await readDailyLogs(config, days);
  
  if (dailyLogs.length === 0) {
    logger('⚠️  No daily logs found for the specified period.');
    return { success: false, reason: 'no_logs' };
  }
  
  logger(`✓ Found ${dailyLogs.length} daily log file(s)`);
  
  // Format logs for LLM
  const logsText = dailyLogs.map(log => {
    return `## ${log.date}\n${log.content}`;
  }).join('\n\n---\n\n');
  
  // Load extraction prompt template
  const promptPath = path.join(skillPath, 'prompts', 'extract.txt');
  const promptTemplate = await fs.readFile(promptPath, 'utf8');
  
  // Replace variables in prompt
  let prompt = promptTemplate
    .replace(/\{\{daysCount\}\}/g, days)
    .replace(/\{\{dailyLogs\}\}/g, logsText)
    .replace(/\{\{existingMemory\}\}/g, memoryContent || '(empty)');
  
  // Call LLM via sub-agent
  logger('🤖 Analyzing with LLM...\n');
  
  const result = await sessions_spawn({
    runtime: "subagent",
    mode: "run",
    task: prompt,
    runTimeoutSeconds: 120
  });
  
  if (!result || !result.response) {
    throw new Error('Sub-agent did not return a valid response');
  }
  
  // Parse response
  const extracted = parseJSONResponse(result.response);
  
  // Count total items
  const totalItems = 
    (extracted.decisions?.length || 0) +
    (extracted.preferences?.length || 0) +
    (extracted.learnings?.length || 0) +
    (extracted.events?.length || 0);
  
  if (totalItems === 0) {
    logger('ℹ️  No new items found worth adding to MEMORY.md');
    if (extracted.duplicates && extracted.duplicates.length > 0) {
      logger(`   (${extracted.duplicates.length} items already in memory)`);
    }
    return { success: true, totalItems: 0, extracted };
  }
  
  logger(`✓ Extracted ${totalItems} item(s)`);
  if (extracted.decisions?.length) logger(`  - ${extracted.decisions.length} decision(s)`);
  if (extracted.preferences?.length) logger(`  - ${extracted.preferences.length} preference(s)`);
  if (extracted.learnings?.length) logger(`  - ${extracted.learnings.length} learning(s)`);
  if (extracted.events?.length) logger(`  - ${extracted.events.length} event(s)`);
  
  // Generate review file
  const reviewPath = getReviewOutputPath(config);
  await generateReviewFile(extracted, reviewPath);
  logger(`\n✓ Review file generated: ${reviewPath}`);
  
  return {
    success: true,
    totalItems,
    extracted,
    reviewPath,
    memoryPath: getMemoryFilePath(config)
  };
}

/**
 * Apply a review file to MEMORY.md
 * 
 * @param {Object} options - Apply options
 * @param {string} options.reviewPath - Path to review file
 * @param {string} options.skillPath - Path to memory-maint skill directory
 * @param {boolean} options.dryRun - Show changes but don't write (default: false)
 * @param {Function} options.logger - Optional logging function
 * @returns {Promise<void>}
 */
async function applyReviewFile({ reviewPath, skillPath, dryRun = false, logger = console.log }) {
  const config = await loadConfig(skillPath);
  const memoryPath = getMemoryFilePath(config);
  
  logger('📝 Applying review to MEMORY.md\n');
  await applyReview(reviewPath, memoryPath, dryRun);
}

module.exports = {
  runReview,
  applyReviewFile,
  loadConfig
};
