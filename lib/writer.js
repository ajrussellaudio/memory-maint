/**
 * Writer module for memory-maint skill
 * Handles generating review files and applying changes to MEMORY.md
 */

const fs = require('fs').promises;
const { createTwoFilesPatch } = require('diff');
const chalk = require('chalk');

/**
 * Generate review file with suggested additions
 * @param {Object} extracted - Extracted content from LLM
 * @param {string} outputPath - Path to write review file
 * @returns {Promise<void>}
 */
async function generateReviewFile(extracted, outputPath) {
  let content = '# Memory Review\n\n';
  content += `_Generated: ${new Date().toISOString()}_\n\n`;
  content += '## Instructions\n\n';
  content += 'Review the suggestions below. Edit as needed, then apply with:\n';
  content += '```bash\n';
  content += `node scripts/review.js --apply ${outputPath}\n`;
  content += '```\n\n';
  content += '---\n\n';
  
  // Decisions
  if (extracted.decisions && extracted.decisions.length > 0) {
    content += '## Decisions\n\n';
    for (const decision of extracted.decisions) {
      content += `### ${decision.summary}\n`;
      if (decision.date) content += `_${decision.date}_\n\n`;
      content += `${decision.context}\n\n`;
    }
  }
  
  // Preferences
  if (extracted.preferences && extracted.preferences.length > 0) {
    content += '## Preferences\n\n';
    for (const pref of extracted.preferences) {
      const confidence = pref.confidence ? ` (${pref.confidence})` : '';
      content += `- **${pref.summary}**${confidence}\n`;
      if (pref.evidence) content += `  - Evidence: ${pref.evidence}\n`;
    }
    content += '\n';
  }
  
  // Learnings
  if (extracted.learnings && extracted.learnings.length > 0) {
    content += '## Learnings\n\n';
    for (const learning of extracted.learnings) {
      content += `- ${learning.summary}\n`;
      if (learning.context) content += `  - ${learning.context}\n`;
    }
    content += '\n';
  }
  
  // Events
  if (extracted.events && extracted.events.length > 0) {
    content += '## Key Events\n\n';
    for (const event of extracted.events) {
      const date = event.date ? `**${event.date}:** ` : '';
      content += `- ${date}${event.summary}\n`;
    }
    content += '\n';
  }
  
  // Duplicates (informational)
  if (extracted.duplicates && extracted.duplicates.length > 0) {
    content += '## Already in MEMORY.md (duplicates)\n\n';
    for (const dup of extracted.duplicates) {
      content += `- ${dup}\n`;
    }
    content += '\n';
  }
  
  await fs.writeFile(outputPath, content, 'utf8');
}

/**
 * Show diff between current MEMORY.md and proposed changes
 * @param {string} currentContent - Current MEMORY.md content
 * @param {string} reviewContent - Review file content (to be appended)
 * @returns {string} - Formatted diff output
 */
function showDiff(currentContent, reviewContent) {
  const newContent = currentContent + '\n\n---\n\n' + reviewContent;
  const patch = createTwoFilesPatch(
    'MEMORY.md (current)',
    'MEMORY.md (after apply)',
    currentContent,
    newContent,
    '',
    ''
  );
  
  // Colorize diff
  const lines = patch.split('\n');
  const colorized = lines.map(line => {
    if (line.startsWith('+')) return chalk.green(line);
    if (line.startsWith('-')) return chalk.red(line);
    if (line.startsWith('@@')) return chalk.cyan(line);
    return line;
  });
  
  return colorized.join('\n');
}

/**
 * Apply review file to MEMORY.md
 * @param {string} reviewPath - Path to review file
 * @param {string} memoryPath - Path to MEMORY.md
 * @param {boolean} dryRun - If true, don't actually write (default: false)
 * @returns {Promise<void>}
 */
async function applyReview(reviewPath, memoryPath, dryRun = false) {
  const reviewContent = await fs.readFile(reviewPath, 'utf8');
  
  // Read current MEMORY.md (or create empty)
  let currentContent = '';
  try {
    currentContent = await fs.readFile(memoryPath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  
  // Strip the metadata/instructions from review file (keep only content)
  const contentStart = reviewContent.indexOf('---\n\n') + 5;
  const additions = reviewContent.slice(contentStart);
  
  // Show diff
  console.log(chalk.bold('\nProposed changes:\n'));
  console.log(showDiff(currentContent, additions));
  
  if (dryRun) {
    console.log(chalk.yellow('\n[Dry run - no changes made]'));
    return;
  }
  
  // Append to MEMORY.md
  const newContent = currentContent.trim() + '\n\n---\n\n' + additions;
  await fs.writeFile(memoryPath, newContent, 'utf8');
  
  console.log(chalk.green('\n✓ MEMORY.md updated successfully'));
}

module.exports = {
  generateReviewFile,
  showDiff,
  applyReview
};
