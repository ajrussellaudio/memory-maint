# Testing Guide

## Overview

The memory-maint tool includes a comprehensive test suite using Jest. This makes it easier to validate functionality without running expensive LLM calls.

## Test Structure

```
tests/
├── fileReader.test.js    - Path expansion, file utilities
├── llm.test.js           - JSON parsing from LLM responses
├── writer.test.js        - Diff generation and formatting
└── integration.test.js   - Full workflow with mocked dependencies
```

## Running Tests

### All tests
```bash
npm test
```

### Watch mode (reruns on file changes)
```bash
npm run test:watch
```

### Coverage report
```bash
npm run test:coverage
```

Opens an HTML coverage report showing which lines are tested.

## What's Tested

### Unit Tests

**fileReader.test.js** (4 tests)
- ✅ Tilde expansion (`~/path` → `/Users/name/path`)
- ✅ Absolute paths unchanged
- ✅ Relative paths unchanged
- ✅ Tilde only at start

**llm.test.js** (7 tests)
- ✅ Parse plain JSON
- ✅ Extract JSON from markdown code blocks
- ✅ Handle nested objects
- ✅ Handle text before JSON block
- ✅ Throw error on invalid JSON
- ✅ Handle empty extraction arrays

**writer.test.js** (3 tests)
- ✅ Show additions to MEMORY.md
- ✅ Handle empty current content
- ✅ Include separator in diff

### Integration Tests

**integration.test.js** (4 tests)
- ✅ Full review workflow with mocked LLM
- ✅ Return early when no logs found
- ✅ Handle empty extraction results
- ✅ Handle LLM errors gracefully

## Test Coverage

Run `npm run test:coverage` to see detailed coverage.

Key modules:
- `lib/llm.js` - JSON parsing fully covered
- `lib/fileReader.js` - Path utilities fully covered
- `lib/writer.js` - Diff generation covered
- `lib/memoryMaint.js` - Main workflow integration tested

## Mocking Strategy

### sessions_spawn
Integration tests mock `sessions_spawn` to return predetermined JSON responses. This lets us test the full workflow without actual LLM calls.

```javascript
mockSessionsSpawn.mockResolvedValue({
  response: mockLLMResponse
});
```

### Filesystem
File operations are mocked to avoid creating/reading real files during tests:

```javascript
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn()
  }
}));
```

## Adding New Tests

### 1. Create test file

```javascript
const { yourFunction } = require('../lib/yourModule');

describe('Your Module', () => {
  test('does something', () => {
    const result = yourFunction();
    expect(result).toBe(expected);
  });
});
```

### 2. Run tests

```bash
npm test
```

### 3. Check coverage

```bash
npm run test:coverage
```

## CI/CD Integration

Tests can be run in CI pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test
  
- name: Check coverage
  run: npm run test:coverage
```

## Why Testing Matters

**Before tests:**
- Had to run full LLM analysis to validate changes
- Expensive and slow (30+ seconds per test)
- Hard to reproduce edge cases

**After tests:**
- Fast validation (< 1 second for all 18 tests)
- No LLM API calls needed
- Easy to test error conditions
- Confidence in refactoring

## Test Philosophy

- **Unit tests** for pure functions (no side effects)
- **Integration tests** with mocked dependencies
- **Keep tests simple** - one concept per test
- **Descriptive names** - test name explains what it validates
- **Fast execution** - entire suite runs in < 1 second

## Future Tests

Potential additions:
- E2E tests with real daily logs (opt-in, uses actual LLM)
- Regression tests for specific bug fixes
- Performance benchmarks
- Schema validation tests
