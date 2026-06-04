# Yotuscript

A YouTube video transcript viewer with bilingual support.

**Language support:** Currently Spanish → English only.

## Quick Start

### For New Users (with demo data)

```bash
# 1. Setup demo data (creates sample transcripts + all required files)
node scripts/setup-demo.js

# 2. Start the server
node server.js

# 3. Open http://localhost:9090 and try the demo transcripts!
```

### For Existing Users (with real videos)

```bash
# 1. Download Spanish transcript from YouTube
# Tell AI: "download VIDEO_ID" (requires yt-dlp + Firefox)

# 2. Tell AI to translate
# "translate new"
# AI asks: "How many grammar sentences? (3, 4, 5, or custom)"

# 3. Watch!
node server.js
```

Open http://localhost:9090

### Data Location

By default, all user data is stored in `~/Work/yotuscript/.data/`:
- `transcripts/` — Original transcript files
- `vocab/` — Vocabulary JSON files
- `grammar/` — Grammar sentence JSON files
- `summary/` — Video summary JSON files
- `data/` — App data (progress, stats, learned videos, etc.)

**To change the location, edit `src/config.js`:**
```javascript
const DATA_ROOT = path.join(os.homedir(), "Work", "yotuscript", ".data");
```

**Or override with environment variable:**
```bash
YOTUSCRIPT_DATA=/path/to/data node server.js
```

This keeps your transcript data separate from the application code and makes it easy to sync across devices.

---

## Features

- **Watch YouTube videos** with synchronized transcripts
- **Dual-language view** (original + English translation)
- **Interactive vocabulary** - Hover words to see translations in tooltips, click to save them
- **Vocabular panel** - Collect and review saved words across all videos with translations and context
- **Active recall review** - Test yourself with hidden translations (asterisks show character count)
- **Grammar sentences** - 3-5 clickable grammar examples per video with explanations
- **Video summaries** - 2-4 sentence summaries in Spanish with original vocabulary
- **Statistics tracking** - Auto-tracks learned videos and total watch time
- **Drag and drop** transcripts between Available and Learned panels
- **Keyboard shortcuts** for quick playback control
- **Auto-synchronized** transcript scrolling


## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Pause/Play |
| `←` | Rewind 5s |
| `→` | Forward 5s |
| `D` | Toggle dual translation |
| `F` | Toggle fullscreen mode |
| `L` | Toggle learned status (resets progress) |
| `R` | Toggle segment repeat mode |
| `G` | Open first grammar sentence popup |
| `V` | Start vocabulary review mode |
| `?` | Show keyboard shortcuts reference |
| `Enter` | Replay current segment (in repeat mode) |
| `Esc` | Close popup / Exit fullscreen |

## Statistics

The app automatically tracks your learning progress:

- **📚 Videos Learned**: Counts when you mark a video as learned (press `L`)
- **⏱️ Watch Time**: Tracks actual viewing time in hours (starts when you play, stops when you pause)

Stats are displayed below the control buttons and persist across sessions.

## Grammar Sentences

Each video includes 3-5 grammar sentences that demonstrate B1+ Spanish structures:

- **Clickable tags** in the "Grammar sentences" panel
- **Full sentence** with English translation in popup
- **Brief explanation** of the grammar structure used
- Examples: subjunctive mood, compound tenses, relative clauses

## Vocabular Panel

Save words while watching to build your personal vocabulary collection:

- **Click any highlighted word** in the transcript to add it to the Vocabular panel
- **Removable tags** — each word has an X button to remove it
- **Click a tag** to open a popup with translation, part of speech, and context
- **Arrow keys** navigate between words when popup is open
- Words persist across sessions and are shared across all videos
- The panel auto-expands when you add your first word

### Vocabulary Review Mode (Press `V`)

Test yourself with active recall:

- Press **`V`** to start reviewing saved words
- Shows the **Spanish word** clearly
- English translation is **hidden** — try to recall it before revealing
- Press **`Y`** if you remembered, **`N`** if not
- Press **`Enter`** to reveal the answer and continue to the next word
- Words you mark as remembered (`Y`) advance through a 5-level mastery system
- **One review per day** — each word can only be reviewed once per day (resets at midnight)

## Video Summaries

Each video includes a **2-4 sentence summary** in Spanish:

- 📋 **Summary icon** next to video title
- **Click to open** popup with full summary
- Uses **original vocabulary** from the transcript
- Captures main ideas and key points
- Perfect for quick review before watching

## Adding Transcripts

### Method 1: Demo Data (For Testing Only)

Run the setup script to create 2 sample transcripts with translations, vocab, grammar, and summaries:

```bash
node scripts/setup-demo.js
```

Creates:
- `demo1234567` — "Introducción al Español" (Beginner)
- `demo7654321` — "Viajar por España" (Intermediate)

**Note:** This creates real files in your data directory. To remove demo data later:
```bash
rm -f ~/Sync/Data/yotuscript/transcripts/demo*.md \
       ~/Sync/Data/yotuscript/vocab/demo*.json \
       ~/Sync/Data/yotuscript/grammar/demo*.json \
       ~/Sync/Data/yotuscript/summary/demo*.json
```

Use `--force` to recreate:
```bash
node scripts/setup-demo.js --force
```

### Method 2: yt-dlp (Recommended for Real Videos)

Tell the AI: `"download VIDEO_ID"` or `"dl VIDEO_ID"`

The AI will download Spanish auto-subtitles from YouTube and create a properly formatted transcript file.

**Requirements:**
- `yt-dlp` installed and in your PATH
- Firefox browser with cookies (for `--cookies-from-browser`)

### Method 3: Browser Extensions

Any extension that extracts YouTube transcripts will work. Copy the transcript and paste it into a new file in the `transcripts/` folder.

### Method 4: Manual

Create transcript files directly in your data `transcripts/` folder (default: `~/Sync/Data/yotuscript/transcripts/`):

```markdown
---
title: "Video Title"
source: "https://www.youtube.com/watch?v=VIDEO_ID"
---

**0:00** First line of transcript
**0:05** Second line
```

**Supported formats:**
- **Markdown timestamps** (recommended): `**MM:SS** Text` or `**H:MM:SS** Text`
- **SRT format**: Sequential numbers with `HH:MM:SS,mmm --> HH:MM:SS,mmm` timestamps
- **With milliseconds**: `**MM:SS.mmm** Text` for precise sync

For sentence-by-sentence translation, create `VIDEO_ID_translation.md` with English text.

## AI Translation

The workflow uses AI directly via `OPENCODE.md`:

### Simple Steps:

1. **Download or add transcript** to `transcripts/` folder
2. **Tell AI**: "translate new"
3. **AI automatically creates**:
   - `VIDEO_ID_translation.md` — Full English translation
   - `vocab/VIDEO_ID_vocab.json` — Vocabulary with contextual translations

### What AI Does:

- ✅ Translates naturally (not word-for-word)
- ✅ Preserves speaker's tone and style
- ✅ Explains cultural references
- ✅ Extracts **multi-word phrases** (2-4 words) as primary vocabulary
- ✅ Creates **3-5 grammar sentences** with B1+ structures (you choose: 3, 4, 5, or custom)
- ✅ Writes **2-4 sentence summary** in Spanish using original vocabulary
- ✅ Provides contextual translations with part of speech and usage examples
- ✅ Excludes basic words, proper nouns, and English loanwords

### Vocabulary Format

Vocabulary files use an extended format with metadata:

```json
{
  "hacer caso": {
    "translation": "to pay attention",
    "pos": "verb phrase",
    "context": "Debes hacer caso a los consejos."
  }
}
```

Each entry includes:
- `translation` — English meaning (1-5 words)
- `pos` — Part of speech (verb, noun, expression, verb phrase, noun phrase)
- `context` — Original sentence from the transcript showing usage

### OPENCODE.md

The `OPENCODE.md` file contains all instructions for the AI. It specifies:
- File format and structure
- Translation guidelines
- Vocabulary extraction rules
- Word exclusions (A1-A2, proper nouns, etc.)

Just tell the AI to read it and translate!

## AI Commands

All operations are AI-driven through `OPENCODE.md`:

### Download
**Command:** `"download VIDEO_ID"` or `"dl VIDEO_ID"`

Downloads Spanish auto-generated subtitles from YouTube using yt-dlp and creates a properly formatted transcript file in `transcripts/VIDEO_ID.md`.

Requires: yt-dlp installed and in PATH, Firefox browser with cookies.

### Translate
**Command:** `"translate new"`

Translates all untranslated transcripts automatically.

### Check / Lint
**Command:** `"check files"` or `"lint"`

Validates and cleans up:
- Frontmatter completeness
- Orphaned files
- Empty translations  
- Vocabulary cleanup

### Manage Learned Videos

Drag and drop transcript tags between panels:
- **Available transcripts** → **Learned transcripts**: Mark as learned (resets progress)
- **Learned transcripts** → **Available transcripts**: Unmark as learned (resets progress)

Or use the `L` keyboard shortcut to toggle the current video.

### Merge Transcript Lines
**Command:** `"merge VIDEO_ID"` or `"merge lines VIDEO_ID"`

Merges short transcript lines into longer segments (80-120 characters per line) for better readability.

### Delete Transcript
**Command:** `"delete VIDEO_ID"` or `"remove VIDEO_ID"` (AI only)

Removes a transcript and all associated files (translation, vocab, progress, learned status). This operation is only available through AI commands, not via the web interface.

## Workflow

```bash
# 1. Download transcript from YouTube
# "download VIDEO_ID"  (requires yt-dlp)

# 2. Tell AI to translate and create files
# "translate new"
# AI asks: "How many grammar sentences? (3, 4, 5, or custom)"

# 3. Watch and learn!
node server.js
# - Hover or click highlighted words for vocabulary
# - Click words to save them to your Vocabular panel
# - Click grammar tags for explanations
# - Click summary icon for video overview
# - Press L to mark as learned
# - Track your stats automatically
```

## License

MIT
