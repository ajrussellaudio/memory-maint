#!/usr/bin/env node

/**
 * memory-maint review script
 * Analyzes daily logs and suggests additions to MEMORY.md
 */

const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

// Import our modules
const { readMemoryFile, readDailyLogs, getMemoryFilePath, getReviewOutputPath } = require('../lib/fileReader');
const { callLLM, parseJSONResponse } = require('../lib/llm');
const { generateReviewFile, applyReview } = require('../lib/writer');

/**
 * Load configuration
 */
async function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');
  const examplePath = path.join(__dirname, '..', 'config.example.json');
  
  try {
    const configData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(chalk.red('Error: config.json not found'));
      console.error(chalk.yellow(`Please copy config.example.json to config.json and configure it:`));
      console.error(chalk.cyan(`  cp ${examplePath} ${configPath}`));
      console.error(chalk.cyan(`  nano ${configPath}`));
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Confirm with user before applying changes
 */
async function confirmApply() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(chalk.yellow('\nApply these changes to MEMORY.md? [y/N] '), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Main review command
 */
async function runReview(options) {
  console.log(chalk.bold.blue('Memory Maintenance - Review\n'));
  
  // Load config
  const config = await loadConfig();
  
  // Override config with command-line options
  if (options.output) {
    config.reviewOutputPath = options.output;
  }
  
  const days = options.days || 7;
  console.log(chalk.gray(`Analyzing last ${days} days of logs...\n`));
  
  try {
    // Read memory files
    const memoryContent = await readMemoryFile(config);
    const dailyLogs = await readDailyLogs(config, days);
    
    if (dailyLogs.length === 0) {
      console.log(chalk.yellow('No daily logs found for the specified period.'));
      console.log(chalk.gray(`Looking for files matching: ${config.dailyLogsPattern}`));
      console.log(chalk.gray(`In directory: ${config.workspacePath}/${config.dailyLogsPath}`));
      return;
    }
    
    console.log(chalk.green(`✓ Found ${dailyLogs.length} daily log file(s)`));
    
    // Format logs for LLM
    const logsText = dailyLogs.map(log => {
      return `## ${log.date}\n${log.content}`;
    }).join('\n\n---\n\n');
    
    // Call LLM for extraction
    console.log(chalk.gray('Analyzing with LLM...\n'));
    const promptPath = path.join(__dirname, '..', 'prompts', 'extract.txt');
    const llmResponse = await callLLM(promptPath, {
      daysCount: days,
      dailyLogs: logsText,
      existingMemory: memoryContent || '(empty)'
    }, config.llmCommand || 'gemini');
    
    // Parse response
    const extracted = parseJSONResponse(llmResponse);
    
    // Count total items
    const totalItems = 
      (extracted.decisions?.length || 0) +
      (extracted.preferences?.length || 0) +
      (extracted.learnings?.length || 0) +
      (extracted.events?.length || 0);
    
    if (totalItems === 0) {
      console.log(chalk.yellow('No new items found worth adding to MEMORY.md'));
      if (extracted.duplicates && extracted.duplicates.length > 0) {
        console.log(chalk.gray(`(${extracted.duplicates.length} items already in memory)`));
      }
      return;
    }
    
    console.log(chalk.green(`✓ Extracted ${totalItems} item(s)`));
    if (extracted.decisions?.length) console.log(chalk.gray(`  - ${extracted.decisions.length} decision(s)`));
    if (extracted.preferences?.length) console.log(chalk.gray(`  - ${extracted.preferences.length} preference(s)`));
    if (extracted.learnings?.length) console.log(chalk.gray(`  - ${extracted.learnings.length} learning(s)`));
    if (extracted.events?.length) console.log(chalk.gray(`  - ${extracted.events.length} event(s)`));
    
    // Generate review file
    const reviewPath = getReviewOutputPath(config);
    await generateReviewFile(extracted, reviewPath);
    console.log(chalk.green(`\n✓ Review file generated: ${reviewPath}`));
    
    // Auto-apply if requested
    if (options.apply) {
      const memoryPath = getMemoryFilePath(config);
      const confirmed = options.yes || await confirmApply();
      
      if (confirmed) {
        await applyReview(reviewPath, memoryPath, options.dryRun);
      } else {
        console.log(chalk.gray('\nChanges not applied. You can apply later with:'));
        console.log(chalk.cyan(`  node scripts/review.js --apply-file ${reviewPath}`));
      }
    } else {
      console.log(chalk.gray('\nReview the suggestions and apply with:'));
      console.log(chalk.cyan(`  node scripts/review.js --apply-file ${reviewPath}`));
    }
    
  } catch (error) {
    console.error(chalk.red(`\nError: ${error.message}`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Apply existing review file
 */
async function runApplyFile(reviewPath, options) {
  console.log(chalk.bold.blue('Memory Maintenance - Apply Review\n'));
  
  const config = await loadConfig();
  const memoryPath = getMemoryFilePath(config);
  
  try {
    const confirmed = options.yes || await confirmApply();
    
    if (confirmed) {
      await applyReview(reviewPath, memoryPath, options.dryRun);
    } else {
      console.log(chalk.gray('Changes not applied.'));
    }
  } catch (error) {
    console.error(chalk.red(`\nError: ${error.message}`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// CLI setup
const program = new Command();

program
  .name('memory-maint review')
  .description('Analyze daily logs and suggest additions to MEMORY.md')
  .version('0.1.0');

program
  .option('-d, --days <number>', 'Number of days to analyze', '7')
  .option('-o, --output <path>', 'Output path for review file')
  .option('--apply', 'Apply suggestions immediately after review')
  .option('--apply-file <path>', 'Apply an existing review file')
  .option('-y, --yes', 'Skip confirmation prompt (auto-apply)')
  .option('--dry-run', 'Show changes but don\'t write to MEMORY.md')
  .option('-v, --verbose', 'Show detailed error messages')
  .action(async (options) => {
    if (options.applyFile) {
      await runApplyFile(options.applyFile, options);
    } else {
      await runReview(options);
    }
  });

program.parse(process.argv);
