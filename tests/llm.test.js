/**
 * Tests for LLM module - specifically JSON parsing
 */

const { parseJSONResponse } = require('../lib/llm');

describe('LLM module', () => {
  describe('parseJSONResponse', () => {
    test('parses plain JSON', () => {
      const json = '{"test": "value"}';
      const result = parseJSONResponse(json);
      expect(result).toEqual({ test: 'value' });
    });

    test('extracts JSON from markdown code blocks', () => {
      const markdown = '```json\n{"test": "value"}\n```';
      const result = parseJSONResponse(markdown);
      expect(result).toEqual({ test: 'value' });
    });

    test('extracts JSON from code blocks without language tag', () => {
      const markdown = '```\n{"test": "value"}\n```';
      const result = parseJSONResponse(markdown);
      expect(result).toEqual({ test: 'value' });
    });

    test('handles JSON with nested objects', () => {
      const json = JSON.stringify({
        decisions: [
          {
            summary: "Test decision",
            context: "Why it matters",
            date: "2026-03-14"
          }
        ],
        preferences: [],
        learnings: []
      });
      const result = parseJSONResponse(json);
      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].summary).toBe("Test decision");
    });

    test('handles LLM responses with text before JSON', () => {
      const response = 'Here is the analysis:\n```json\n{"test": "value"}\n```';
      const result = parseJSONResponse(response);
      expect(result).toEqual({ test: 'value' });
    });

    test('throws error on invalid JSON', () => {
      const invalid = 'not valid json';
      expect(() => parseJSONResponse(invalid)).toThrow();
    });

    test('handles empty arrays in extraction format', () => {
      const extractionResult = JSON.stringify({
        decisions: [],
        preferences: [],
        learnings: [],
        events: [],
        duplicates: []
      });
      const result = parseJSONResponse(extractionResult);
      expect(result.decisions).toEqual([]);
      expect(result.preferences).toEqual([]);
    });
  });
});
