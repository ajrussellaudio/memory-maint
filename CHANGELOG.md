# Changelog

All notable changes to memory-maint will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Conflict detection** - Identifies potential contradictions in recent work (Phase 2 feature)
- New `scripts/conflicts.js` command to check for conflicts
- `lib/conflicts.js` module with detection and formatting logic
- `prompts/conflicts.txt` - Conservative conflict detection prompt
- `runConflictDetection()` function exported from memoryMaint.js
- 6 new unit tests for conflict detection formatting
- Conservative approach: only flags genuine contradictions, not reinforcement

### Changed
- Default conflict detection window: 14 days (vs 7 for review)
- Documentation updated with conflict detection usage

### Design Philosophy
- **Conservative by default:** Won't flag repeated learnings (reinforcement is good!)
- **Focus on contradictions:** Refactored code vs modifying "original", reversed decisions
- **Not aggressive:** When in doubt, assumes consistency rather than conflict

## [0.1.0] - 2026-03-14

### Added
- Initial release of memory-maint skill
- Review command to analyze daily logs and suggest MEMORY.md additions
- LLM integration via OpenClaw's sessions_spawn (no external API keys needed)
- Extraction of decisions, preferences, learnings, and key events
- Deduplication against existing MEMORY.md
- Diff preview before applying changes
- Configurable workspace paths and file patterns
- Comprehensive documentation (SKILL.md, README.md, SETUP.md, TESTING.md)
- Unit test suite with 18 tests (Jest)
- Integration tests with mocked LLM
- Example usage code for agents
- AgentSkill-compliant structure for ClawHub distribution

### Features
- **Smart extraction**: Only promotes content that changes future behavior
- **Safety first**: Always shows diff and requires confirmation before applying
- **Dry-run mode**: Preview changes without writing to files
- **Flexible config**: Works with any workspace structure
- **No API keys**: Uses OpenClaw's built-in model access
- **Fast tests**: Validate changes without LLM calls

### Documentation
- Complete SKILL.md for agent consumption
- Human-readable README with examples
- SETUP.md for configuration guidance
- TESTING.md for contributors
- BUILD-SUMMARY.md documenting the build process

### Technical
- Node.js >= 18
- Dependencies: commander, chalk, date-fns, diff
- Dev dependencies: jest
- Test coverage: 62% overall, 87% on core workflow

[0.1.0]: https://github.com/ajrussellaudio/memory-maint/releases/tag/v0.1.0
