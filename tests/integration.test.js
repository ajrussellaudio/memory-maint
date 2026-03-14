/**
 * Integration tests for memory-maint
 * These test the full flow with mocked dependencies
 */

const fs = require('fs').promises;
const path = require('path');
const { runReview } = require('../lib/memoryMaint');

// Mock sessions_spawn
const mockSessionsSpawn = jest.fn();

// Mock filesystem
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn()
  }
}));

describe('Memory Maint Integration', () => {
  const skillPath = '/test/skill/path';
  const mockConfig = {
    workspacePath: '/test/workspace',
    memoryFile: 'MEMORY.md',
    dailyLogsPath: 'memory',
    dailyLogsPattern: 'YYYY-MM-DD.md',
    reviewOutputPath: 'memory-review.md'
  };

  const mockDailyLog = `# 2026-03-14

## Test Event
Did something important today

## Decision Made
Chose option A over option B because it was better
`;

  const mockMemory = `# MEMORY.md

Existing content
`;

  const mockLLMResponse = `\`\`\`json
{
  "decisions": [
    {
      "summary": "Chose option A over option B",
      "context": "Better for long-term goals",
      "date": "2026-03-14"
    }
  ],
  "preferences": [],
  "learnings": [],
  "events": [
    {
      "summary": "Did something important",
      "date": "2026-03-14"
    }
  ],
  "duplicates": []
}
\`\`\``;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock config.json read
    fs.readFile.mockImplementation((filePath) => {
      if (filePath.includes('config.json')) {
        return Promise.resolve(JSON.stringify(mockConfig));
      }
      if (filePath.includes('MEMORY.md')) {
        return Promise.resolve(mockMemory);
      }
      if (filePath.includes('2026-03-14.md')) {
        return Promise.resolve(mockDailyLog);
      }
      if (filePath.includes('extract.txt')) {
        return Promise.resolve('Mock prompt {{dailyLogs}} {{existingMemory}}');
      }
      return Promise.reject(new Error('ENOENT'));
    });

    // Mock sessions_spawn to return analysis
    mockSessionsSpawn.mockResolvedValue({
      response: mockLLMResponse
    });
  });

  test('successfully extracts and generates review', async () => {
    const result = await runReview({
      days: 1,
      skillPath,
      sessions_spawn: mockSessionsSpawn,
      logger: jest.fn()
    });

    expect(result.success).toBe(true);
    expect(result.totalItems).toBe(2); // 1 decision + 1 event
    expect(result.extracted.decisions).toHaveLength(1);
    expect(result.extracted.events).toHaveLength(1);
    
    // Verify sessions_spawn was called
    expect(mockSessionsSpawn).toHaveBeenCalled();
    
    // Verify writeFile was called for review
    expect(fs.writeFile).toHaveBeenCalled();
  });

  test('returns early if no logs found', async () => {
    // Mock no daily logs
    fs.readFile.mockImplementation((filePath) => {
      if (filePath.includes('config.json')) {
        return Promise.resolve(JSON.stringify(mockConfig));
      }
      if (filePath.includes('MEMORY.md')) {
        return Promise.resolve(mockMemory);
      }
      // No daily logs - reject with ENOENT
      return Promise.reject({ code: 'ENOENT', message: 'File not found' });
    });

    const result = await runReview({
      days: 1,
      skillPath,
      sessions_spawn: mockSessionsSpawn,
      logger: jest.fn()
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('no_logs');
    expect(mockSessionsSpawn).not.toHaveBeenCalled();
  });

  test('handles empty extraction results', async () => {
    // Mock LLM returning empty arrays
    mockSessionsSpawn.mockResolvedValue({
      response: JSON.stringify({
        decisions: [],
        preferences: [],
        learnings: [],
        events: [],
        duplicates: []
      })
    });

    const result = await runReview({
      days: 1,
      skillPath,
      sessions_spawn: mockSessionsSpawn,
      logger: jest.fn()
    });

    expect(result.success).toBe(true);
    expect(result.totalItems).toBe(0);
  });

  test('handles sessions_spawn errors', async () => {
    mockSessionsSpawn.mockRejectedValue(new Error('LLM timeout'));

    await expect(
      runReview({
        days: 1,
        skillPath,
        sessions_spawn: mockSessionsSpawn,
        logger: jest.fn()
      })
    ).rejects.toThrow('LLM timeout');
  });
});
