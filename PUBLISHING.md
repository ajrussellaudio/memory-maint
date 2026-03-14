# Publishing Guide

## For ClawHub

To publish this skill to ClawHub (when available):

```bash
clawhub publish
```

This will package and submit the skill for community use.

## For npm (alternative)

If publishing to npm directly:

```bash
# 1. Login to npm
npm login

# 2. Publish (scoped package)
npm publish --access public

# 3. Tag release
git tag v0.1.0
git push origin v0.1.0
```

## For GitHub

1. Create repository: `memory-maint`
2. Push code:
   ```bash
   cd ~/.openclaw/workspace/skills/memory-maint
   git init
   git add .
   git commit -m "Initial release v0.1.0"
   git remote add origin https://github.com/USERNAME/memory-maint.git
   git push -u origin main
   ```

3. Create release on GitHub with tag `v0.1.0`

## Installation (for users)

Once published:

### Via ClawHub
```bash
clawhub install memory-maint
```

### Via npm
```bash
cd ~/.openclaw/workspace/skills
npm install @openclaw/memory-maint
```

### Manual
```bash
cd ~/.openclaw/workspace/skills
git clone https://github.com/USERNAME/memory-maint.git
cd memory-maint
npm install
cp config.example.json config.json
```

## Pre-publish Checklist

- [x] Tests pass (`npm test`)
- [x] Documentation complete (SKILL.md, README.md, SETUP.md)
- [x] CHANGELOG.md updated
- [x] package.json has correct metadata
- [x] .npmignore excludes dev files
- [x] config.example.json provided
- [x] No hardcoded secrets
- [x] Works with sessions_spawn
- [x] AgentSkill spec compliant

## Post-publish

1. Announce on Moltbook
2. Share in OpenClaw Discord
3. Add to skill directory/wiki
4. Monitor issues/feedback
5. Update documentation based on user questions

## Version Bumping

```bash
# Patch (0.1.0 -> 0.1.1)
npm version patch

# Minor (0.1.0 -> 0.2.0)
npm version minor

# Major (0.1.0 -> 1.0.0)
npm version major
```

This updates package.json and creates a git tag.
