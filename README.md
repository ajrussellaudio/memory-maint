# Memory Maintenance Tool for OpenClaw Agents

A systematic memory curation tool that helps OpenClaw agents review their daily logs and promote important information to long-term memory.

## Problem

Agent memory is only as good as manual curation discipline. Daily logs accumulate, important context gets buried, and there's no systematic process for deciding what's worth remembering long-term.

## Solution

`memory-maint` analyzes your daily logs using an LLM and suggests curated additions to `MEMORY.md`, focusing on:

- **Decisions**: What was chosen and why
- **Preferences**: User likes/dislikes and workflow patterns  
- **Learnings**: Mistakes corrected and new insights
- **Key Events**: Milestones and significant changes

## Installation

```bash
cd ~/Documents/playground/memory-maint
npm install
cp config.example.json config.json
```

Edit `config.json` to match your workspace structure:

```json
{
  "workspacePath": "~/.openclaw/workspace",
  "memoryFile": "MEMORY.md",
  "dailyLogsPath": "memory",
  "dailyLogsPattern": "YYYY-MM-DD.md",
  "model": "auto",
  "reviewOutputPath": "memory-review.md",
  "llmCommand": "gemini"
}
```

## Usage

### Review last 7 days of logs

```bash
node scripts/review.js
```

This will:
1. Scan daily logs from the last 7 days
2. Analyze them with your configured LLM
3. Generate `memory-review.md` with suggestions
4. Show you what would be added

### Detect conflicts in recent work

```bash
node scripts/conflicts.js
```

This checks for potential contradictions in your daily logs, such as:
- Refactoring code then modifying the "original" version
- Reversing decisions without explanation
- Incompatible preferences

**Note:** The tool is conservative - it won't flag repeated learnings (reinforcement is good!).

### Apply suggestions

After reviewing the suggestions in `memory-review.md`, apply them:

```bash
node scripts/review.js --apply-file memory-review.md
```

### One-step review and apply

```bash
node scripts/review.js --apply
```

You'll be prompted to confirm before changes are written.

### More options

```bash
# Review last 14 days
node scripts/review.js --days 14

# Custom output file
node scripts/review.js --output review-2026-03-14.md

# Auto-apply without confirmation (use carefully!)
node scripts/review.js --apply --yes

# Dry run (show changes but don't write)
node scripts/review.js --apply --dry-run

# Check for conflicts in last 14 days
node scripts/conflicts.js --days 14

# Save conflicts report
node scripts/conflicts.js --output conflicts-report.md
```

## How It Works

1. **Scan**: Reads daily log files (`memory/YYYY-MM-DD.md`) for the specified period
2. **Extract**: Sends logs to LLM with a specialized extraction prompt
3. **Deduplicate**: Checks against existing `MEMORY.md` to avoid repeating content
4. **Generate**: Creates a review file with structured suggestions
5. **Apply**: Appends approved suggestions to `MEMORY.md`

## Integration with Heartbeat

Add to your `HEARTBEAT.md` for weekly maintenance:

```markdown
## Memory Maintenance (weekly)
If it's been 7+ days since last review:
1. Run `node ~/Documents/playground/memory-maint/scripts/review.js --days 7`
2. Review suggestions in memory-review.md
3. Apply with `--apply-file memory-review.md` if they look good
```

## Privacy & Security

- All processing happens locally
- No data sent anywhere except to your configured LLM (via `gemini` or similar)
- No API keys in code - uses your existing OpenClaw model setup
- Review files are plain text markdown you can read/edit before applying

## Future Features

- **Conflict detection**: Notice when new work contradicts recent history
- **Preference tracking**: Catch casual mentions worth remembering
- **Deduplication**: Flag redundant content across memory files
- **Session log analysis**: Deeper context from full conversation history

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

The test suite includes:
- **Unit tests** for file operations, JSON parsing, and diff generation
- **Integration tests** with mocked LLM calls to validate full workflow
- **18 total tests** covering core functionality

All tests must pass before committing changes.

### Test Coverage

Current coverage:
- `lib/fileReader.js`: Path expansion, config loading
- `lib/llm.js`: JSON parsing from various formats
- `lib/writer.js`: Diff generation
- `lib/memoryMaint.js`: Full review workflow (mocked)

## Requirements

- Node.js >= 18
- OpenClaw workspace with standard memory structure
- LLM access via OpenClaw's sessions_spawn

## License

MIT

## Author

bishoptheandroid - Built for the OpenClaw agent community
