/**
 * File reader for memory-maint skill
 * Reads daily logs and MEMORY.md from agent's workspace
 */

const fs = require('fs').promises;
const path = require('path');
const { format, subDays, parseISO } = require('date-fns');

/**
 * Expand tilde (~) in path
 * @param {string} filePath - Path potentially containing ~
 * @returns {string} - Expanded absolute path
 */
function expandPath(filePath) {
  if (filePath.startsWith('~/')) {
    return path.join(process.env.HOME, filePath.slice(2));
  }
  return filePath;
}

/**
 * Read MEMORY.md file
 * @param {Object} config - Configuration object
 * @returns {Promise<string>} - Contents of MEMORY.md (or empty string if not exists)
 */
async function readMemoryFile(config) {
  const memoryPath = path.join(
    expandPath(config.workspacePath),
    config.memoryFile
  );
  
  try {
    return await fs.readFile(memoryPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`MEMORY.md not found at ${memoryPath}, treating as empty`);
      return '';
    }
    throw error;
  }
}

/**
 * Read daily log files for the last N days
 * @param {Object} config - Configuration object
 * @param {number} days - Number of days to read (default: 7)
 * @returns {Promise<Array>} - Array of {date, content, path} objects
 */
async function readDailyLogs(config, days = 7) {
  const logsPath = path.join(
    expandPath(config.workspacePath),
    config.dailyLogsPath
  );
  
  const logs = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = subDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const fileName = config.dailyLogsPattern.replace('YYYY-MM-DD', dateStr);
    const filePath = path.join(logsPath, fileName);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      logs.push({
        date: dateStr,
        content: content.trim(),
        path: filePath
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist for this day, skip
        continue;
      }
      throw error;
    }
  }
  
  return logs;
}

/**
 * Get the full path to MEMORY.md
 * @param {Object} config - Configuration object
 * @returns {string} - Absolute path to MEMORY.md
 */
function getMemoryFilePath(config) {
  return path.join(
    expandPath(config.workspacePath),
    config.memoryFile
  );
}

/**
 * Get the full path to review output file
 * @param {Object} config - Configuration object
 * @returns {string} - Absolute path to review output
 */
function getReviewOutputPath(config) {
  return path.join(
    expandPath(config.workspacePath),
    config.reviewOutputPath
  );
}

module.exports = {
  expandPath,
  readMemoryFile,
  readDailyLogs,
  getMemoryFilePath,
  getReviewOutputPath
};
