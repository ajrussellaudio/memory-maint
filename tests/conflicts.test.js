/**
 * Tests for conflict detection module
 */

const { formatConflictsMarkdown } = require('../lib/conflicts');

describe('Conflict detection', () => {
  describe('formatConflictsMarkdown', () => {
    test('handles empty conflicts array', () => {
      const markdown = formatConflictsMarkdown([]);
      expect(markdown).toContain('No conflicts detected');
    });

    test('formats single conflict', () => {
      const conflicts = [
        {
          type: 'contradictory_action',
          summary: 'Script refactoring vs modifying original',
          severity: 'high',
          item1: {
            summary: 'Refactored script.js',
            date: '2026-03-13',
            context: 'Complete rewrite'
          },
          item2: {
            summary: 'Modified original script.js',
            date: '2026-03-14',
            context: 'Added feature to old version'
          },
          question: 'Should the feature be added to the refactored version instead?'
        }
      ];

      const markdown = formatConflictsMarkdown(conflicts);
      
      expect(markdown).toContain('1 potential conflict');
      expect(markdown).toContain('Script refactoring vs modifying original');
      expect(markdown).toContain('Refactored script.js');
      expect(markdown).toContain('Modified original script.js');
      expect(markdown).toContain('2026-03-13');
      expect(markdown).toContain('2026-03-14');
      expect(markdown).toContain('Should the feature be added to the refactored version');
    });

    test('formats multiple conflicts', () => {
      const conflicts = [
        {
          type: 'contradictory_action',
          summary: 'First conflict',
          severity: 'medium',
          item1: { summary: 'Action 1', date: '2026-03-13' },
          item2: { summary: 'Action 2', date: '2026-03-14' },
          question: 'Which is correct?'
        },
        {
          type: 'reversed_decision',
          summary: 'Second conflict',
          severity: 'low',
          item1: { summary: 'Decision A', date: '2026-03-12' },
          item2: { summary: 'Decision B', date: '2026-03-14' },
          question: 'Why was this reversed?'
        }
      ];

      const markdown = formatConflictsMarkdown(conflicts);
      
      expect(markdown).toContain('2 potential conflict');
      expect(markdown).toContain('1. First conflict');
      expect(markdown).toContain('2. Second conflict');
      expect(markdown).toContain('Which is correct?');
      expect(markdown).toContain('Why was this reversed?');
    });

    test('includes severity indicators', () => {
      const highConflict = [{
        type: 'contradictory_action',
        summary: 'Test',
        severity: 'high',
        item1: { summary: 'A', date: '2026-03-13' },
        item2: { summary: 'B', date: '2026-03-14' },
        question: 'Test'
      }];

      const markdown = formatConflictsMarkdown(highConflict);
      expect(markdown).toContain('🔴'); // High severity emoji
    });

    test('includes resolution guidance', () => {
      const conflicts = [{
        type: 'contradictory_action',
        summary: 'Test',
        severity: 'low',
        item1: { summary: 'A', date: '2026-03-13' },
        item2: { summary: 'B', date: '2026-03-14' },
        question: 'Test'
      }];

      const markdown = formatConflictsMarkdown(conflicts);
      expect(markdown).toContain('What to Do');
      expect(markdown).toContain('evolution/refinement');
      expect(markdown).toContain('Update MEMORY.md');
    });

    test('handles missing context gracefully', () => {
      const conflicts = [{
        type: 'contradictory_action',
        summary: 'Test',
        severity: 'medium',
        item1: { summary: 'Action 1', date: '2026-03-13' },
        item2: { summary: 'Action 2' }, // No date
        question: 'What happened?'
      }];

      const markdown = formatConflictsMarkdown(conflicts);
      expect(markdown).toContain('Action 1');
      expect(markdown).toContain('Action 2');
      expect(markdown).toContain('unknown'); // Missing date placeholder
    });
  });
});
