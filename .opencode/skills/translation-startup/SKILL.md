---
name: translation-startup
description: "Automatically loaded when the yotuscript project opens. Reads config.js and OPENCODE.md to establish translation context."
version: 1.0.0
---

# Yotuscript Startup

Read configuration and translation instructions at the start of every session.

## On Session Start

1. **Read `src/config.js`** — Get actual data paths (reads `YOTUSCRIPT_DATA` env var, defaults to `~/Sync/Data/yotuscript`)
2. **Read `OPENCODE.md`** — Translation workflow and rules
3. **Read `data/a1-a2.json`** — Basic words exclusion list (first 50 lines)
4. **Check transcript directory** — List available transcript files

## Path Resolution

Always use paths from `src/config.js`:
- **TRANSCRIPTS_DIR** — Where transcript `.md` files live
- **VOCAB_DIR** — Where `_vocab.json` files live
- **GRAMMAR_DIR** — Where `_grammar.json` files live
- **SUMMARY_DIR** — Where `_summary.json` files live
- **DATA_DIR** — Where `a1-a2.json`, `learned.json`, etc. live

If `YOTUSCRIPT_DATA` env var is set, use that as the base directory.

## After Reading

Ask user: "What would you like to do? (translate new, check files, merge lines, or something else)"

## Available Commands

- `download VIDEO_ID` — Download YouTube transcript using `./download VIDEO_ID`
- `translate new` — Translate all untranslated transcripts
- `check files` / `lint` — Validation and cleanup
- `merge VIDEO_ID` — Merge short transcript lines
- `delete VIDEO_ID` — Remove transcript and associated files

## Important

When running any command that accesses transcripts, vocab, grammar, or summary files:
1. First read `src/config.js` to get the correct paths
2. Use those paths instead of hardcoded `transcripts/`, `vocab/`, etc.
3. The user may have set `YOTUSCRIPT_DATA` to a custom location
