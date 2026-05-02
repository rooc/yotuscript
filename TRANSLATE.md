# AI Translation Instructions for YouTube Videos

## Task
Create an English translation file for a YouTube video transcript.

## Input
- Original transcript file in `/transcripts/` folder (e.g., `6OvgRqD3ICY_transcript.md`)
- Video URL in frontmatter: `source: "https://www.youtube.com/watch?v=VIDEO_ID"`

## Output
Create a new file: `VIDEO_ID_translation.md` in the same `/transcripts/` folder.

## Format Requirements

### Frontmatter
```markdown
---
title: "Original Title (English Translation)"
source: "https://www.youtube.com/watch?v=VIDEO_ID"
---
```

### Transcript Lines
Each line must follow this exact format:
```markdown
**M:SS** · English translation text
```

Where:
- `M:SS` = minutes:seconds (e.g., `0:00`, `1:30`, `12:05`)
- `·` = middle dot character (U+00B7)
- Text = natural English translation

### Example
```markdown
---
title: "How cartels use gold to launder money | BBC Mundo Special (English Translation)"
source: "https://www.youtube.com/watch?v=6OvgRqD3ICY"
---

## Transcript

**0:00** · Gold, an element that has fascinated humans for millennia.

**0:05** · For the pre-Hispanic peoples, it had a ceremonial use.

**0:09** · It was a way to connect the earthly with the divine.

**0:14** · But when the Europeans conquered America they brought another vision.

**0:19** · For them it had a purely economic value.
```

## Rules
1. **Match timestamps exactly** - Each line must have the same timestamp as the original
2. **Translate naturally** - Use fluent English, not word-for-word literal translation
3. **Preserve meaning** - Keep the original intent and tone
4. **One line per timestamp** - Each `**M:SS**` entry should be one complete thought
5. **No extra lines** - Don't add or remove lines, match the original count

## File Naming
- Format: `VIDEO_ID_translation.md`
- Example: `6OvgRqD3ICY_translation.md`
