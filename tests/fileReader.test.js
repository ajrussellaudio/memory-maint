/**
 * Tests for fileReader module
 */

const { expandPath } = require('../lib/fileReader');
const path = require('path');

describe('fileReader', () => {
  describe('expandPath', () => {
    test('expands tilde to home directory', () => {
      const result = expandPath('~/test/path');
      expect(result).toBe(path.join(process.env.HOME, 'test/path'));
    });

    test('leaves absolute paths unchanged', () => {
      const absolutePath = '/absolute/path';
      expect(expandPath(absolutePath)).toBe(absolutePath);
    });

    test('leaves relative paths unchanged', () => {
      const relativePath = './relative/path';
      expect(expandPath(relativePath)).toBe(relativePath);
    });

    test('handles tilde at start only', () => {
      const pathWithTilde = 'some/~/path';
      expect(expandPath(pathWithTilde)).toBe(pathWithTilde);
    });
  });

  // Note: readMemoryFile and readDailyLogs would need filesystem mocking
  // We can add those tests if needed, but they're more integration-level
});
