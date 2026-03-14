#!/usr/bin/env node

/**
 * memory-maint conflicts script
 * Detects potential conflicts in recent daily logs
 */

const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

// Import modules
const { readDailyLogs } = require('../lib/fileReader');
const { detectConflicts, formatConflictsMarkdown } = require('../lib/conflicts');

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
 * Main conflicts detection command
 */
async function runConflicts(options) {
  console.log(chalk.bold.blue('Memory Maintenance - Conflict Detection\n'));
  
  // Load config
  const config = await loadConfig();
  const days = options.days || 14; // Default to 2 weeks for conflict detection
  
  console.log(chalk.gray(`Analyzing last ${days} days for conflicts...\n`));
  
  try {
    // Read daily logs
    const dailyLogs = await readDailyLogs(config, days);
    
    if (dailyLogs.length === 0) {
      console.log(chalk.yellow('No daily logs found for the specified period.'));
      return;
    }
    
    console.log(chalk.green(`✓ Found ${dailyLogs.length} daily log file(s)`));
    
    // Detect conflicts
    const result = await detectConflicts({
      days,
      dailyLogs,
      skillPath: path.join(__dirname, '..'),
      sessions_spawn: sessions_spawn,
      logger: console.log
    });
    
    if (result.conflicts.length === 0) {
      console.log(chalk.green('\n✓ No conflicts detected - everything looks consistent!'));
      return;
    }
    
    // Generate conflicts report
    if (options.output) {
      const markdown = formatConflictsMarkdown(result.conflicts);
      const outputPath = path.join(config.workspacePath.replace('~', process.env.HOME), options.output);
      await fs.writeFile(outputPath, markdown, 'utf8');
      console.log(chalk.green(`\n✓ Conflicts report saved to: ${outputPath}`));
    }
    
    console.log(chalk.yellow('\n⚠️  Review the conflicts above and determine if they need resolution.'));
    console.log(chalk.gray('Note: Not all flagged items are true conflicts - use your judgment.'));
    
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
  .name('memory-maint conflicts')
  .description('Detect potential conflicts in recent daily logs')
  .version('0.1.0');

program
  .option('-d, --days <number>', 'Number of days to analyze', '14')
  .option('-o, --output <path>', 'Save conflicts report to file (relative to workspace)', 'conflicts-report.md')
  .option('-v, --verbose', 'Show detailed error messages')
  .action(async (options) => {
    await runConflicts(options);
  });

program.parse(process.argv);
