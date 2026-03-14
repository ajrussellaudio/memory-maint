/**
 * Tests for writer module
 */

const { showDiff } = require('../lib/writer');
const chalk = require('chalk');

// Disable chalk colors for testing
chalk.level = 0;

describe('writer module', () => {
  describe('showDiff', () => {
    test('shows additions to MEMORY.md', () => {
      const current = '# MEMORY.md\n\nExisting content';
      const additions = '## New Section\n\nNew content';
      
      const diff = showDiff(current, additions);
      
      // Should contain the additions
      expect(diff).toContain('## New Section');
      expect(diff).toContain('New content');
      // Should contain diff markers
      expect(diff).toContain('@@');
    });

    test('handles empty current content', () => {
      const current = '';
      const additions = '## First Entry\n\nContent';
      
      const diff = showDiff(current, additions);
      
      expect(diff).toContain('First Entry');
    });

    test('shows separator between sections', () => {
      const current = 'Existing';
      const additions = 'New';
      
      const diff = showDiff(current, additions);
      
      // Should include the separator
      expect(diff).toContain('---');
    });
  });

  // generateReviewFile would need filesystem mocking
  // applyReview would need both filesystem and readline mocking
  // We can add those if needed for more comprehensive testing
});
