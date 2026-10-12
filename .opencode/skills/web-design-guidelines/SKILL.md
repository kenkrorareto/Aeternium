---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance (100+ rules on accessibility, focus states, forms, animation, typography, images, performance, navigation, touch, safe areas, dark mode, locale, hydration). Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  source: https://github.com/vercel-labs/agent-skills
  guidelines-source: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
  version: "1.0.0"
---

# Web Interface Guidelines

Review files for compliance with the Web Interface Guidelines.

## How It Works

1. Read the local rules in `references/guidelines.md` (vendored copy — no network needed)
2. Read the specified files (or ask the user which files/pattern to review)
3. Check against all rules in the guidelines
4. Output findings in the terse `file:line` format specified in the guidelines

## Guidelines Source

The full rule set lives in `references/guidelines.md` next to this file. It is a
vendored snapshot of:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Refresh the local copy only when asked to "update the guidelines": re-download
that URL into `references/guidelines.md`, preserving the HTML comment header.

## Usage

When a user provides a file or pattern argument:

1. Read `references/guidelines.md`
2. Read the specified files
3. Apply all rules from the guidelines
4. Output findings using the format specified in the guidelines

If no files are specified, ask the user which files to review.
