# Setup Guide for memory-maint

## Quick Start

1. **Install dependencies**
   ```bash
   cd ~/Documents/playground/memory-maint
   npm install
   ```

2. **Configure your workspace**
   ```bash
   cp config.example.json config.json
   nano config.json  # edit paths to match your workspace
   ```

3. **Configure LLM access** (choose one method):

### Method A: Gemini CLI (recommended for OpenClaw users)

Set your Gemini API key:
```bash
export GEMINI_API_KEY="your-key-here"
```

Or add to your shell profile (~/.zshrc or ~/.bashrc):
```bash
echo 'export GEMINI_API_KEY="your-key-here"' >> ~/.zshrc
source ~/.zshrc
```

Then configure gemini CLI:
```bash
gemini config
```

In config.json:
```json
{
  "llmCommand": "gemini"
}
```

### Method B: Custom wrapper script

Create a script that:
1. Reads prompt from stdin
2. Calls your preferred LLM
3. Outputs response to stdout

Example (`~/bin/my-llm-wrapper.sh`):
```bash
#!/bin/bash
# Read stdin into variable
PROMPT=$(cat)

# Call your LLM (this example uses curl with Claude API)
curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "content-type: application/json" \
  -d "{
    \"model\": \"claude-3-5-sonnet-20241022\",
    \"max_tokens\": 4096,
    \"messages\": [{\"role\": \"user\", \"content\": \"$PROMPT\"}]
  }" | jq -r '.content[0].text'
```

Make it executable:
```bash
chmod +x ~/bin/my-llm-wrapper.sh
```

In config.json:
```json
{
  "llmCommand": "~/bin/my-llm-wrapper.sh"
}
```

### Method C: Direct API calls (future)

OpenClaw native integration coming in future version.

## Testing

Once configured, test with:
```bash
node scripts/review.js --days 3
```

This should:
1. Find your daily logs
2. Call the LLM to analyze them
3. Generate memory-review.md
4. Show a summary

## Troubleshooting

### "GEMINI_API_KEY not set"

You need to configure LLM access (see Method A or B above).

### "No daily logs found"

Check that:
- `workspacePath` in config.json points to your workspace
- `dailyLogsPath` is correct (usually "memory")
- You have files matching `YYYY-MM-DD.md` pattern

### "Failed to parse LLM response"

Your LLM returned invalid JSON. Check:
- LLM is working: `echo "test" | gemini`
- Response format matches expected JSON structure
- Try with `--verbose` flag for full output

## Next Steps

Once working:
1. Run a review: `node scripts/review.js --days 7`
2. Check memory-review.md
3. Apply if good: `node scripts/review.js --apply-file memory-review.md`
4. Integrate with heartbeat for weekly maintenance
