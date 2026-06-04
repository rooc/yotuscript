# AI Transcript Translation Instructions

You are translating Spanish YouTube transcripts to English. Follow these instructions **exactly**.

---

## Quick Workflow

**Simple command:** Just say "**translate new**" to translate all untranslated transcripts.

**Automatic Validation:** Every input file is validated before translation starts. Files must have complete frontmatter (title + source URL) and proper timestamp format. See "Step 0: Input Validation" below for details.

**Important:** When extracting vocabulary, prioritize **multi-word phrases (2-4 words)** over single words. Phrases like "hacer caso", "en pocas palabras", "sistema inmunitario" are more useful than individual words. See vocabulary extraction rules below for details.

**Before translating, ask for grammar sentence count using clickable options:**

Present these options to the user:
- **3 sentences** (default/recommended)
- **4 sentences**
- **5 sentences**
- **Custom number** (user specifies)

Wait for user selection before proceeding with translation.

Or manually:
1. **Find** transcript files in `transcripts/` folder (e.g., `087XVp3JIpk.md`)
2. **Skip** if `[ID]_translation.md` already exists
3. **Create** three files for each new transcript:
   - `transcripts/[ID]_translation.md` — Full English translation
   - `vocab/[ID]_vocab.json` — Vocabulary with contextual translations
   - `grammar/[ID]_grammar.json` — Grammar sentences with explanations

---

## Step 0: Input Validation (REQUIRED Before Translation)

**CRITICAL:** Before starting any translation, the input file MUST pass ALL validation checks below. If any check fails, stop and report the issue.

**IMPORTANT:** Always read `src/config.js` first to get the correct paths. The transcript directory may be in `~/Sync/Data/yotuscript/transcripts/` or another location set via `YOTUSCRIPT_DATA` env var.

### ✅ Validation Checklist (MUST PASS ALL):

1. **File Location & Extension**
   - [ ] File is in the transcripts folder (read path from `src/config.js`)
   - [ ] File ends with `.md` extension
   - [ ] File does NOT contain `_translation` in filename
   - [ ] File does NOT have a matching `[ID]_translation.md` already

2. **Frontmatter Required Fields**
   - [ ] Has `title:` field with non-empty value
   - [ ] Has `source:` field with valid YouTube URL (format: `https://www.youtube.com/watch?v=VIDEO_ID`)

3. **Content Format**
   - [ ] Has at least one timestamped line (format: `**M:SS**`, `**M:SS.mmm**`, `**H:MM:SS**`, or `**H:MM:SS.mmm**`)
   - [ ] Contains Spanish text content (not empty)

### ❌ Skip These Files (Do Not Process):
- `*_translation.md` files (already translated)
- Files without YouTube source URL in frontmatter
- Files missing required frontmatter fields (title or source)
- Non-transcript markdown files (README, TODO, etc.)
- Files with invalid or missing timestamps

### Validation Failure Messages:

If validation fails, report exactly what's wrong:
```
❌ VALIDATION FAILED: transcripts/VIDEO_ID.md
   - Missing: title field in frontmatter
   ❌ CANNOT PROCEED WITH TRANSLATION
```

```
❌ VALIDATION FAILED: transcripts/VIDEO_ID.md
   - Invalid source URL: "https://example.com/video"
   - Expected: YouTube URL (https://www.youtube.com/watch?v=...)
   ❌ CANNOT PROCEED WITH TRANSLATION
```

---

## Step 1: Identify Files to Process

### ✅ Process these files:
- Files in transcripts folder (path from `src/config.js`)
- End with `.md`
- Do NOT contain `_translation` in filename
- Do NOT have a matching `[ID]_translation.md`

### ❌ Skip these files:
- `*_translation.md` (already translated)
- Files without YouTube source URL
- Non-transcript markdown files (README, etc.)

### Extract Video ID:
From filename or source URL:
```
Filename: 087XVp3JIpk.md → Video ID: 087XVp3JIpk
Source: https://www.youtube.com/watch?v=087XVp3JIpk → Video ID: 087XVp3JIpk
```

---

## Step 2: Parse Transcript Format

**Input format:**
```markdown
---
title: "Video Title in Spanish"
source: "https://www.youtube.com/watch?v=VIDEO_ID"
---

**0:00** Primera línea en español
**0:05** Segunda línea en español
**1:23** Tercera línea en español
```

**Timestamp formats:**
- `**M:SS**` — minutes:seconds
- `**M:SS.mmm**` — minutes:seconds.milliseconds
- `**H:MM:SS**` — hours:minutes:seconds
- `**H:MM:SS.mmm**` — hours:minutes:seconds.milliseconds

---

## Step 3: Create Translation File

**Output:** `transcripts/[VIDEO_ID]_translation.md`

```markdown
---
title: "Video Title in Spanish (English Translation)"
source: "https://www.youtube.com/watch?v=VIDEO_ID"
---

**0:00** First line in English
**0:05** Second line in English
**1:23** Third line in English
```

### Translation Guidelines

**DO:**
- ✅ Translate naturally, like a human speaker
- ✅ Preserve the speaker's tone (casual, formal, humorous, etc.)
- ✅ Keep cultural references clear (add brief context if needed)
- ✅ Maintain timestamp alignment with original Spanish
- ✅ Use proper English punctuation and capitalization
- ✅ Translate idioms to their English equivalents

**DON'T:**
- ❌ Translate word-for-word (sounds robotic)
- ❌ Skip sentences or paragraphs
- ❌ Change the meaning or add opinions

**Example:**
```
Spanish: **0:15** ¡Qué padre! Vamos al cine.
English: **0:15** How cool! Let's go to the movies.

Spanish: **1:30** Estoy hasta la madre de esto.
English: **1:30** I'm fed up with this. (Mexican slang)
```

---

## Step 4: Create Vocabulary File

**Output:** `vocab/[VIDEO_ID]_vocab.json`

**Standard Format (Extended with Metadata):**

```json
{
  "phrase in spanish": {
    "translation": "english translation",
    "pos": "part of speech",
    "context": "original sentence from transcript"
  }
}
```

**Required Fields:**
1. **translation** — English meaning (1-5 words, lowercase)
2. **pos** — Part of speech:
   - `"verb"`, `"noun"`, `"adjective"`, `"adverb"`
   - `"verb phrase"`, `"noun phrase"` for multi-word expressions
   - `"expression"` for idioms/slang
3. **context** — Original Spanish sentence from transcript (shows usage)

**Example:**
```json
{
  "hacer caso": {
    "translation": "to pay attention",
    "pos": "verb phrase",
    "context": "Debes hacer caso a tu madre."
  },
  "muela del juicio": {
    "translation": "wisdom tooth",
    "pos": "noun phrase",
    "context": "Me duele la muela del juicio."
  },
  "hasta la madre": {
    "translation": "fed up",
    "pos": "expression",
    "context": "Estoy hasta la madre de este ruido."
  }
}
```

### Vocabulary Extraction Rules (DEFAULT FOR ALL TRANSLATIONS)

**⚠️ CRITICAL:** You MUST extract multi-word phrases (2-4 words) as the PRIMARY vocabulary. Single words are secondary.

**Extract BOTH single words AND multi-word phrases:**

#### Single Words (B1+ LEVEL)
- Individual words at B1 level or higher
- Technical/specialized terms

**⚠️ IMPORTANT:** Vocabulary selection is based on **B1+ GRAMMAR COMPLEXITY**, not just word difficulty. This means:
- **Exclude** simple A1-A2 words when used in basic tenses (present, preterite)
- **INCLUDE** A1-A2 words when they appear in **B1+ grammatical structures** (subjunctive, conditional, compound tenses, etc.)

#### Multi-Word Phrases (2-4 words) - HIGH PRIORITY
These are often MORE useful than single words. **Extract phrases that demonstrate B1+ grammar, even if individual words are basic:**

**Complex Verb Phrases (2-3 words) - B1+ GRAMMAR RULE:**
Extract 2-3 word phrases containing **complex verb tenses and grammatical structures** EVEN if individual words are A1-A2 level. These demonstrate B1+ grammar and are valuable for learning:

**Include phrases with these B1+ structures:**
- **Subjunctive (present)**: "sin haberla visto" (without having seen her), "que tú digas" (that you say), "cuando vengas" (when you come)
- **Imperfect subjunctive**: "si tuviera" (if I had), "quisiera que fuera" (I would like it to be), "ojalá supiera" (I wish I knew) — very common in spoken Spanish, always extract
- **Past perfect subjunctive**: "si hubiera sabido" (if I had known), "ojalá hubiera podido" (I wish I could have)
- **Conditional**: "lo haría" (I would do it), "querrías venir" (would you want to come), "me gustaría" (I would like)
- **Future**: "lo haré" (I will do it), "qué será" (what will it be), "dirán que" (they will say that)
- **Imperfect**: "cuando era" (when I was), "lo hacía" (I used to do it), "si tenía" (if I had)
- **Compound tenses**: "había comido" (had eaten), "habría dicho" (would have said), "ha estado" (has been)
- **Conditional perfect with indirect object pronouns**: "les habría llevado" (it would have taken them), "nos habría costado" (it would have cost us), "te habría gustado" (you would have liked it) — the conditional perfect combined with indirect object pronouns creates complex B1+ verb phrases that should always be extracted
- **Gerund constructions**: "llevaba esperando" (had been waiting), "sigue hablando" (keeps talking), "sin saberlo" (without knowing it) — gerund is B1+ and often missed
- **Imperative + object pronoun**: "dime eso" (tell me that), "cuéntame" (tell me), "dámelo" (give it to me)
- **Relative clauses**: "el libro que compré" (the book that I bought), "la persona de quien hablamos" (the person we're talking about)
- **Reflexive pronouns + verbs**: "me acuerdo de" (I remember), "se olvidan de" (they forget)
- **Preposition + infinitive**: "antes de comer" (before eating), "después de llegar" (after arriving), "al entrar" (upon entering)
- **Subjunctive-triggering conjunctions + verb**: "aunque llueva" (even if it rains), "para que entiendas" (so that you understand), "a menos que vengas" (unless you come), "con tal de que funcione" (as long as it works) — the conjunction + subjunctive chunk is always extractable as a unit
- **Passive constructions** (ser/estar + past participle): "fue construido" (it was built), "está roto" (it's broken), "estaba perdido" (was lost) — distinguish from simple "es bueno / está aquí" which are excluded

**Examples to extract (B1+ grammar, even with basic words):**
- "sin haberla visto" — perfect infinitive with pronouns
- "que tú dirás" — future in subordinate clause
- "si hubiera sabido" — past perfect subjunctive
- "me lo estoy diciendo" — present progressive with double pronouns
- "lo he hecho" — present perfect (auxiliary + participle)
- "para que entiendas" — present subjunctive
- "aunque llueva" — subjunctive triggered by conjunction
- "si tuviera tiempo" — imperfect subjunctive
- "llevaba tres horas esperando" — durative past with gerund
- "cuando llegué" — preterite in time clause (advanced usage)
- "ojalá supiera" — imperfect subjunctive (very common in spoken Spanish)
- "ojalá hubiera podido" — past perfect subjunctive
- "con tal de que funcione" — subjunctive-triggering conjunction + verb
- "les habría llevado" — conditional perfect with indirect object pronoun (would have taken them)

**Key principle:** A word like "decir" (A1) in simple present "yo digo" is excluded. But "que dirás" is included because it demonstrates B1+ grammar (future in subordinate clause).

**Verb + Preposition combinations:**
- "hacer caso" (to pay attention)
- "tener en cuenta" (to take into account)
- "dar la lata" (to annoy/bother)
- "ponerse a" (to start doing)
- "acabar de" (to have just done)
- "contar con" (to count on)
- "soñar con" (to dream about)
- "acordarse de" (to remember)
- "pensar en" (to think about)
- "depender de" (to depend on)

**Common collocations:**
- "muela del juicio" (wisdom tooth)
- "cuenta bancaria" (bank account)
- "tiempo libre" (free time)
- "lugar común" (common place/cliché)

**Idiomatic expressions:**
- "hasta la madre" (fed up)
- "en el quinto pino" (in the middle of nowhere)
- "costar un ojo de la cara" (to cost an arm and a leg)

#### Reflexive Verbs with Meaning Shift

**Always extract reflexive forms when they have a distinct meaning from the base verb**, even if the base verb is A1-A2:

- "ir" → "irse" (to leave/take off)
- "dormir" → "dormirse" (to fall asleep)
- "poner" → "ponerse" (to become / to put on)
- "llevar" → "llevarse" (to take away / to get along with)
- "quedar" → "quedarse" (to stay / to remain)

These are B1+ semantics regardless of the base verb's level.

#### Morphological Forms to Include

Even when the base word is A1-A2, include the following morphological forms:

- **Superlatives (-ísimo)**: "rapidísimo", "grandísimo", "chiquitísimo" — the form itself is B1+
- **Non-standard diminutives**: "chiquitito", "ahorita" (especially in Latin American Spanish)
- **Nominalizations of basic verbs**: "el saber", "el querer" — gerund/infinitive used as a noun

**DO NOT extract simple phrases:**
- Simple present: "yo digo", "él come", "tú tienes"
- Simple preterite: "yo dije", "él comió", "tú tuviste"
- Basic ser/estar: "es bueno", "está aquí"
- These don't demonstrate B1+ grammar complexity

**DO NOT extract overly simple multi-word phrases:**
Even 2-3 word phrases should be excluded if they consist entirely of A1-A2 basic components without B1+ grammatical complexity. These are too simple:

- **Negative + basic verb in simple tense**: "no entiendo", "no sé", "no creo"
- **Pronoun + simple past**: "me dijo", "te vi", "nos contó" — basic preterite with indirect objects
- **Basic verb + preposition**: "voy a", "es para", "tengo que" — A1-level combinations
- **Simple subordinate clauses with indicative**: "no sé si", "creo que", "dice que" — **but only when followed by a simple indicative clause**. If the same opener is followed by subjunctive, conditional, or a complex structure — include the whole phrase. Examples:
  - "no sé si vendrá" → include (future)
  - "creo que hubiera sido mejor" → include (past perfect subjunctive)
  - "no sé si viene" → exclude (simple present)
- **Subject + simple verb**: "tú eres", "yo digo", "él tiene" — elementary sentence structure

**Key rule:** If ALL words in the phrase are A1-A2 basic AND the grammatical structure is elementary (present, preterite, basic word order), **skip it**. Only include multi-word phrases that demonstrate B1+ grammar complexity OR contain at least one B1+ word.

#### ⚠️ CRITICAL: Never Skip Compound Tenses

**Even when ALL individual words are A1-A2 basic verbs, ALWAYS extract phrases containing compound or auxiliary verb constructions.** The grammatical structure itself is B1+ regardless of the base verb's level.

**ALWAYS extract when you see these patterns:**
- **había + past participle**: "yo había quedado", "había hablado", "había comido" — past perfect
- **he/ha/han + past participle**: "me he despertado", "se ha convertido", "hemos decidido" — present perfect
- **he/ha estado + gerund**: "he estado mirando", "ha estado lloviendo" — present perfect progressive
- **hacía + noun + gerund**: "me hacía mucha ilusión" — imperfect with emotional state
- **a no ser que + subjunctive**: "a no ser que tengas" — subjunctive-triggering construction
- **aunque + imperfect subjunctive**: "aunque la cita nos diese" — imperfect subjunctive

**Real examples that were WRONGLY skipped:**
- ❌ "yo había quedado" — base verb "quedar" is A1, but **past perfect is B1+**
- ❌ "había hablado" — base verb "hablar" is A1, but **past perfect is B1+**
- ❌ "me he despertado" — base verb "despertar" is A1-A2, but **present perfect reflexive is B1+**
- ❌ "he estado mirando" — "estar" and "mirar" are both A1, but **present perfect progressive is B1+**
- ❌ "aunque la cita nos diese" — "dar" is A1, but **imperfect subjunctive is B1+**

**When scanning transcripts, specifically look for:**
- Forms of **haber** (he, ha, había, habría, hubiera, hubo) followed by a past participle
- Forms of **estar** (he estado, ha estado) followed by a gerund (-ando, -iendo)
- Subjunctive-triggering phrases: "a no ser que", "aunque", "para que", "con tal de que"

**Never skip a phrase just because you recognize the base verb as simple. Check the actual conjugated form and grammatical structure first.**

#### ⚠️ CRITICAL: Never Skip Idioms, Slang, or Figurative Expressions

**Even when every individual word is A1-A2 basic, ALWAYS extract idioms, slang, and figurative expressions.** The meaning is NOT compositional — learners cannot deduce it from the individual words.

**ALWAYS extract:**
- Fixed expressions with non-literal meaning
- Slang and colloquialisms
- Regional/cultural phrases
- Metaphorical phrases

**Real examples that would be wrongly skipped if judged word-by-word:**
- ❌ "hasta la madre" — "hasta"=until (A1), "la"=the (A1), "madre"=mother (A1) → but means "fed up" (expression)
- ❌ "frío que pela" — "frío"=cold (A1), "que"=that (A1), "pela"=peels (A1) → but means "freezing cold" (expression)
- ❌ "dar palo" — "dar"=to give (A1), "palo"=stick (A1) → but means "to be a hassle" (expression)
- ❌ "se la suda" — "se" (A1), "la" (A1), "suda"=sweats (A1) → but means "doesn't care at all" (expression)
- ❌ "mal del siglo" — all words are basic → but means "disease of the century" as a fixed phrase
- ❌ "cuerpo radioactivo" — literal words but used figuratively to mean "very healthy young body"

**When scanning transcripts, watch for:**
- Words that seem odd or humorous in context (often slang/idioms)
- Phrases where the literal translation makes no sense
- Common Spanish expressions: "hacer ilusión", "dar palo", "echar para atrás", "pasar frío", "de vez en cuando", "en pocas palabras"
- Slang and colloquial markers that indicate non-literal usage

**Never judge an expression by the difficulty of its individual words. Judge by whether the meaning is literal or idiomatic.**

**DO NOT extract (skip these):

#### 1. Basic A1-A2 Words
Read `data/a1-a2.json` for the complete exclusion list (~680 words). These include:
- Articles: el, la, los, las, un, una, unos, unas
- Pronouns: yo, tú, él, ella, nosotros, vosotros, ellos, me, te, se, nos, os
- Basic verbs: ser, estar, tener, haber, hacer, poder, decir, ir, ver, dar, saber, querer
- Common adjectives: bueno, malo, grande, pequeño, alto, bajo, nuevo, viejo
- Time words: hoy, ayer, mañana, ahora, siempre, nunca, cuando, donde
- Conjunctions: y, o, pero, porque, si, aunque, mientras
- Basic nouns: casa, agua, comida, día, tiempo, año, persona, cosa

#### 2. Proper Nouns
Read `data/proper-nouns.json` for exclusions:
- Country names: España, México, Estados Unidos, Argentina, etc.
- Human names: María, Juan, Carlos, Ana, José, etc.
- Place names: Amazonia, Alaska, Arizona, etc.

#### 3. Manual Exclusions
Read `data/manual-exclude.json` for additional exclusions:
- podcast, español, okay, tren, mafia, washington, etc.

#### 4. English Loanwords
Skip words that are the same or similar in English:
- podcast, internet, chat, online, video, audio
- okay, cool, boom, surprise, obviously, useful, make sense

#### 5. Very Short Words
- Skip single words with 3 or fewer letters (unless important)
- Skip verb conjugations of basic verbs (tengo, tienes, tiene → all from "tener")

### Translation Quality

**For each vocabulary entry:**

- **Key:** Spanish phrase/word (prioritize 2-4 word phrases)
- **translation:** English meaning (1-5 words, lowercase)
- **pos:** Part of speech (verb, noun, adjective, expression, verb phrase, noun phrase)
- **context:** Original sentence from transcript showing usage

**Good examples:**
```json
{
  "masticar": {
    "translation": "to chew",
    "pos": "verb",
    "context": "Tienes que masticar bien la comida."
  },
  "muela del juicio": {
    "translation": "wisdom tooth",
    "pos": "noun phrase",
    "context": "Me duele la muela del juicio."
  },
  "hacer caso": {
    "translation": "to pay attention",
    "pos": "verb phrase",
    "context": "Debes hacer caso a tu madre."
  },
  "hasta la madre": {
    "translation": "fed up",
    "pos": "expression",
    "context": "Estoy hasta la madre de este ruido."
  }
}
```

**Translation guidelines:**
- ✅ Use 1-5 words for translation, lowercase
- ✅ Include pos: "expression" for idioms/slang, "verb phrase" for verb+preposition
- ✅ Include full context sentence from transcript
- ✅ Good: "hacer caso" → "to pay attention" with context
- ❌ Bad: Missing pos or context fields

### Additional Word Categories to Include

#### Compound Nouns

Extract compound nouns (words formed by combining two or more words):

- "abrelatas" (can opener)
- "paraguas" (umbrella)
- "muela del juicio" (wisdom tooth)
- "sacacorchos" (corkscrew)
- "lavaplatos" (dishwasher)

#### False Friends

Words that look like English but have different meanings:

| Spanish | Looks Like | Actually Means |
|---------|-----------|----------------|
| actual | actual | current/present |
| embarazada | embarrassed | pregnant |
| éxito | exit | success |
| asistir | assist | to attend |
| pretender | pretend | to try/attempt |
| realizar | realize | to carry out/do |

#### Abstract Nouns

Include abstract concepts and ideas:

- "libertad" (freedom)
- "alegría" (joy)
- "justicia" (justice)
- "felicidad" (happiness)
- "conocimiento" (knowledge)

#### Adverbs and Conjunctions

Often B1+ level, especially transitional phrases:

- "sin embargo" (however)
- "por lo tanto" (therefore)
- "aunque" (even if/although)
- "a pesar de" (despite)
- "a menos que" (unless)
- "mientras tanto" (meanwhile)

### Advanced Forms of A1-A2 Words

Include **all forms** of A1-A2 words if they appear in **B1+ structures**:

| Base Word | A1-A2 Form | B1+ Form | Translation |
|-----------|-----------|----------|-------------|
| tener | tengo | tendría | I would have |
| ser | soy | sería | I would be |
| estar | estoy | estaré | I will be |
| ir | voy | iría | I would go |
| hacer | hago | haré | I will do |

**Include these advanced forms:**
- **Subjunctive**: "tenga" (I have), "sea" (I am), "haga" (I do)
- **Conditional**: "tendría" (I would have), "sería" (I would be)
- **Future**: "tendré" (I will have), "seré" (I will be)
- **Imperfect**: "tenía" (I had), "era" (I was)
- **Compound tenses**: "he tenido" (I have had), "había sido" (I had been)
- **Reflexive forms**: "me levanto" (I get up), "te vistes" (you get dressed)

### Quick Reference: Include vs Exclude

| **Category** | **Include** | **Exclude** |
|--------------|-------------|-------------|
| **Multi-word phrases** | All (prioritize these) | None |
| **Verb forms** | Subjunctive, conditional, future, imperfect, compound tenses, reflexive | Only if standalone **and** simple present/preterite **and** in A1-A2 list |
| **Single words** | Superlatives, diminutives, abstract nouns, false friends, technical terms, reflexive verbs | Only if standalone **and** in A1-A2 list **and** not advanced |
| **Compound nouns** | All | None |
| **Idioms/Expressions** | All | None |
| **Proper nouns** | None | All |
| **English loanwords** | None | All |

**Key Principle: When in doubt, include the word/phrase.** Better to over-include than miss important vocabulary.

### Implementation Tips

1. **Use CEFR Lists**: Cross-check words against **A1-A2 lists** (e.g., [Spanish CEFR vocabulary](https://www.spanishdict.com/cefr)) to confirm level.

2. **Leverage POS Tagging**: Use **part-of-speech tagging** to identify verb forms, adjectives, etc.

3. **Regex for Verb Forms**: Use **regular expressions** to catch advanced verb forms:
   - Future endings: -é, -ás, -á, -emos, -éis, -án
   - Conditional endings: -ía, -ías, -ía, -íamos, -íais, -ían
   - Subjunctive indicators: que + different stem/ending

4. **Contextual Analysis**: For ambiguous words, **include context** in the output to clarify meaning.

5. **Prioritize Comprehensiveness**: When in doubt, **include the word/phrase**. Better to over-include than miss important vocabulary.

---

## Step 4b: Create Grammar Sentences File

**Output:** `grammar/[VIDEO_ID]_grammar.json`

**Extract the user-selected number of sentences per video** (3, 4, 5, or custom) that demonstrate B1+ grammar structures:

### Target Grammar Structures (select 3 different ones):

**Subjunctive Mood:**
- Present subjunctive: "Espero que vengas" (I hope you come)
- Past subjunctive: "Si fuera rico, viajaría" (If I were rich, I would travel)
- Perfect subjunctive: "Dudo que haya comido" (I doubt he has eaten)

**Compound Tenses:**
- Past perfect: "Ya había terminado" (I had already finished)
- Future perfect: "Habré terminado mañana" (I will have finished tomorrow)
- Conditional perfect: "Habría venido si..." (I would have come if...)

**Complex Structures:**
- Passive voice: "Fue construido en 1990" (It was built in 1990)
- Reported speech: "Dijo que vendría" (He said he would come)
- Relative clauses: "El libro que compré..." (The book that I bought...)

### Sentence Selection Criteria:
- ✅ Natural sentences from the transcript (not made up)
- ✅ Different grammar structures (don't pick 3 subjunctive sentences)
- ✅ Actually used in the video
- ✅ Include English translation
- ✅ Brief grammar explanation (1 sentence)

### JSON Structure:
```json
[
  {
    "spanish": "Si hubiera sabido eso, no habría venido.",
    "english": "If I had known that, I wouldn't have come.",
    "explanation": "Past perfect subjunctive + conditional perfect for hypothetical past"
  },
  {
    "spanish": "Es importante que estudies todos los días.",
    "english": "It's important that you study every day.",
    "explanation": "Present subjunctive after impersonal expression 'es importante que'"
  },
  {
    "spanish": "Para cuando llegué, ya se habían ido.",
    "english": "By the time I arrived, they had already left.",
    "explanation": "Past perfect - action completed before another past action"
  }
]
```

**IMPORTANT:** Choose sentences that are:
1. **Actually in the transcript** (not fabricated)
2. **Different grammar types** (mix tenses/moods)
3. **Useful for learning** (common structures)
4. **With short explanations** (1 sentence max)

---

## Step 4c: Create Summary File

**Output:** `summary/[VIDEO_ID]_summary.json`

**Write a short summary** of the video content in Spanish (2-4 sentences), using the original vocabulary from the transcript.

### Summary Guidelines:
- **Language:** Spanish (original language of the video)
- **Length:** 2-4 sentences
- **Style:** Use vocabulary from the transcript (not simplified A1-A2 words)
- **Content:** Main topic, key points, main conclusion or takeaway
- **Format:** Plain text, not markdown

### JSON Structure:
```json
{
  "summary": "Spanish summary text here using original vocabulary from the transcript. Should capture the main ideas and key points of the video in 2-4 sentences."
}
```

### Example:
```json
{
  "summary": "Este episodio explica por qué tenemos muelas del juicio y por qué duelen tanto cuando salen. El dentista describe cómo extrajo una muela con tres raíces en lugar de una sola. También se discute la tradición del Ratón Pérez en España versus el Hada de los Dientes en Estados Unidos."
}
```

---

## Step 5: File Creation

### Create Four Files

For each transcript, create **four** files:

1. **Translation file** in transcripts folder (path from `src/config.js`)
2. **Vocab file** in vocab folder (path from `src/config.js`)
3. **Grammar file** in grammar folder (path from `src/config.js`)
4. **Summary file** in summary folder (path from `src/config.js`)

**IMPORTANT:** Always read `src/config.js` to get actual paths. The user may have set `YOTUSCRIPT_DATA` env var to a custom location like `~/Sync/Data/yotuscript/`.

### Naming Convention

```
transcripts/087XVp3JIpk.md          ← Original (you read this)
transcripts/087XVp3JIpk_translation.md  ← Translation (you create this)
vocab/087XVp3JIpk_vocab.json       ← Vocabulary (you create this)
grammar/087XVp3JIpk_grammar.json   ← Grammar sentences (you create this)
summary/087XVp3JIpk_summary.json   ← Video summary (you create this)
```

**Note:** The paths above are relative to the data root directory specified in `src/config.js` (defaults to `~/Sync/Data/yotuscript/` or value of `YOTUSCRIPT_DATA` env var).

---

## Example: Complete Translation

### Input: `transcripts/087XVp3JIpk.md`
```markdown
---
title: "Un diente menos"
source: "https://www.youtube.com/watch?v=087XVp3JIpk"
---

**0:00** Hola a todos y bienvenidos a un nuevo episodio
**0:05** de nuestro podcast para aprender español
**0:10** aquí hablamos español de una manera no muy rápida
```

### Output: `transcripts/087XVp3JIpk_translation.md`
```markdown
---
title: "Un diente menos (English Translation)"
source: "https://www.youtube.com/watch?v=087XVp3JIpk"
---

**0:00** Hello everyone and welcome to a new episode
**0:05** of our podcast to learn Spanish
**0:10** here we speak Spanish in a not very fast way
```

### Output: `vocab/087XVp3JIpk_vocab.json`
```json
{
  "bienvenidos": {
    "translation": "welcome",
    "pos": "adjective",
    "context": "Hola a todos y bienvenidos a un nuevo episodio."
  },
  "episodio": {
    "translation": "episode",
    "pos": "noun",
    "context": "Bienvenidos a un nuevo episodio de nuestro podcast."
  },
  "manera": {
    "translation": "way / manner",
    "pos": "noun",
    "context": "Aquí hablamos español de una manera no muy rápida."
  }
}
```

### Output: `grammar/087XVp3JIpk_grammar.json`
```json
[
  {
    "spanish": "Si hubiera sabido eso, no habría venido.",
    "english": "If I had known that, I wouldn't have come.",
    "explanation": "Past perfect subjunctive (hubiera sabido) + conditional perfect (habría venido) - used for hypothetical situations in the past"
  },
  {
    "spanish": "Es importante que estudies todos los días.",
    "english": "It's important that you study every day.",
    "explanation": "Present subjunctive (estudies) after impersonal expression 'es importante que'"
  },
  {
    "spanish": "Para cuando llegué, ya se habían ido.",
    "english": "By the time I arrived, they had already left.",
    "explanation": "Past perfect (se habían ido) - action completed before another past action"
  }
]
```

---

## Contextual Translation Tips

**Same word, different contexts:**

| Spanish | Context | English Translation |
|---------|---------|---------------------|
| **sacar** | dental | to extract (a tooth) |
| **sacar** | general | to take out |
| **sacar** | photos | to take (a photo) |
| **diente** | anatomy | tooth |
| **diente** | garlic | clove |
| **raíz** | tooth | root |
| **raíz** | plant | root |
| **raíz** | math | square root |

**Always consider the context when translating vocabulary!**

---

## Quality Checklist

### Before Starting (Input Validation & Setup):
- [ ] Input file has required frontmatter: `title:` and `source:` with YouTube URL
- [ ] Input file has at least one timestamped line with Spanish content
- [ ] No matching `[ID]_translation.md` file already exists
- [ ] Asked user for grammar sentence count using clickable options (3, 4, 5, or custom)

### Before Finishing (Output Verification):
- [ ] Translation file has same timestamps as original
- [ ] All sentences are translated (no `[TRANSLATION NEEDED]` placeholders)
- [ ] Vocabulary excludes A1-A2 words (check `data/a1-a2.json`)
- [ ] Vocabulary excludes proper nouns (check `data/proper-nouns.json`)
- [ ] Vocabulary excludes manual exclusions (check `data/manual-exclude.json`)
- [ ] Vocabulary translations are contextual (not dictionary definitions)
- [ ] JSON is valid (proper commas, quotes, brackets)
- [ ] Files are saved in correct folders

---

## Common Mistakes to Avoid

❌ **Including basic words:**
- Don't add: "hola", "adiós", "gracias", "por favor", "bien", "mal"
- Do add: "bienvenidos", "episodio", "masticar", "sabiduría"

❌ **Literal translations:**
- Don't: "I have hunger" (from "tengo hambre")
- Do: "I'm hungry"

❌ **Missing context:**
- Don't: "raíz" → "root" (too vague)
- Do: "raíz" → "root (of tooth)" or "root (of plant)"

❌ **Inconsistent timestamps:**
- Don't change timestamps from original
- Do keep exact same format: `**M:SS**`, `**M:SS.mmm**`, `**H:MM:SS**`, or `**H:MM:SS.mmm**`

---

## When You're Done

After creating the files:

1. **Confirm** both files were created successfully
2. **List** what you created:
   ```
   ✅ Created: transcripts/087XVp3JIpk_translation.md
   ✅ Created: vocab/087XVp3JIpk_vocab.json
   ```
3. **Ask** if you should continue with more transcripts

---

## Summary

**Your job:**
1. **Read** `src/config.js` to get the correct data paths (especially if `YOTUSCRIPT_DATA` env var is set)
2. **Validate** `transcripts/[ID].md` has required frontmatter (title + source URL) and proper format
3. Read `transcripts/[ID].md` (using path from config)
4. Create `transcripts/[ID]_translation.md` (full English translation, using path from config)
5. Create `vocab/[ID]_vocab.json` (B1+ vocabulary with multi-word phrases, using path from config)
6. Create `grammar/[ID]_grammar.json` (user-selected number of sentences with B1+ grammar + explanations, using path from config)
7. Skip files that already have translations
8. Exclude basic words (see `data/a1-a2.json`), proper nouns (see `data/proper-nouns.json`), and manual exclusions (see `data/manual-exclude.json`)

**Goal:** Help language learners understand Spanish YouTube videos with accurate translations, contextual vocabulary, and grammar-focused learning sentences.

---

## Lint & Cleanup Commands

In addition to translation, you can also run maintenance checks. Just say the command:

### "check files" or "lint"

Performs validation and cleanup:

**What it checks:**
1. **Frontmatter validation** - Every transcript must have:
   - `title:` field
   - `source:` field with YouTube URL
2. **Orphaned files** - Vocab/translation files without matching transcript
3. **Empty translations** - Translation files with `[TRANSLATION NEEDED]` placeholders
4. **Vocabulary cleanup** - Remove A1-A2 words from vocab files

**How to run:**
Just say: `"check files"` or `"lint"`

The AI will:
- Read `src/config.js` to get the correct paths
- Scan all files in transcripts/ and vocab/ (using paths from config)
- Report any issues found
- Optionally fix them (with your approval)

**Example report:**
```
=== LINT REPORT ===

✅ All transcripts have complete frontmatter
✅ No orphaned files
⚠️  2 translation(s) need content:
   - NEWVIDEO1_translation.md
   - NEWVIDEO2_translation.md
🧹 Cleaned 1 vocabulary file(s):
   - VIDEO1_vocab.json: removed 3/150 words

=== LINT COMPLETE ===
```

**Auto-fix options:**
- `"fix frontmatter"` - Add missing title/source fields
- `"clean vocab"` - Remove A1-A2 words from all vocab files
- `"remove orphans"` - Delete orphaned vocab/translation files

---

### Merge Transcript Lines
**Command:** `"merge VIDEO_ID"` or `"merge lines VIDEO_ID"`

Merges short transcript lines to create longer segments (80-120 characters per line) for better readability:
- Keeps the first timestamp of each merged segment
- Removes redundant timestamps from merged lines
- Preserves all original text content
- Preserves milliseconds in timestamps when present
- Maintains 80-120 character target length per line

**How to use:**
Just say: `"merge 087XVp3JIpk"` or `"merge lines Psb9g9UxqZs"`

The AI will:
- Read the original transcript file
- Merge consecutive lines to achieve 80-120 character segments
- Keep timestamps aligned with merged content
- Preserve milliseconds in timestamps when present
- Overwrite the original file with the merged version
- Report how many lines were reduced

**Example:**
```
Before (short lines):
**0:00** Hola a todos y bienvenidos a un nuevo
**0:03** episodio de nuestro podcast para
**0:05** aprender español aquí hablamos español
**0:10** de una manera no muy rápida Clara y
**0:14** cuando menciono una palabra difícil la
**0:17** intento

After (merged lines):
**0:00** Hola a todos y bienvenidos a un nuevo episodio de nuestro podcast para aprender español aquí hablamos español
**0:10** de una manera no muy rápida Clara y cuando menciono una palabra difícil la intento
```

**Note:** This modifies the original transcript file. Use before translation if you want cleaner segments.

---

### Delete Transcript
**Command:** `"delete VIDEO_ID"` or `"remove VIDEO_ID"`

Removes a transcript and all associated files (reads paths from `src/config.js`):
- transcripts/VIDEO_ID.md
- transcripts/VIDEO_ID_translation.md
- vocab/VIDEO_ID_vocab.json
- grammar/VIDEO_ID_grammar.json
- summary/VIDEO_ID_summary.json
- Progress data
- Learned status

**How to use:**
Just say: `"delete 087XVp3JIpk"` or `"remove Psb9g9UxqZs"`

The AI will:
- Read `src/config.js` to get the correct paths
- Confirm which files will be deleted (using the actual paths)
- Ask for your confirmation
- Delete all associated files
- Report what was removed

**Note:** This cannot be undone! Make sure you want to delete before confirming.

---

### Download YouTube Transcript
**Command:** `"download VIDEO_ID"` or `"dl VIDEO_ID"`

Downloads Spanish auto-generated subtitles from YouTube and creates a properly formatted transcript file.

**How it works (AI executes directly):**
1. Run `./download VIDEO_ID` script which will:
   - Check if Spanish subtitles are available
   - Download using yt-dlp
   - Convert to project format with millisecond timestamps
   - Save to the transcripts directory (from `src/config.js`)
2. Alternatively, manual steps:
   - Run yt-dlp to fetch Spanish auto-subtitles
   - Get video title from YouTube
   - Parse the SRT file and convert timestamps to the project's format
   **Preserve milliseconds!** Use `**M:SS.mmm**` or `**H:MM:SS.mmm**` when the SRT contains them:
   ```
   SRT: 00:00:05,320 --> 00:00:08,150
   →    **0:05.320** Texto aquí
   ```
4. Write `transcripts/[VIDEO_ID].md` with frontmatter:
   ```markdown
   ---
   title: "Video Title from YouTube"
   source: "https://www.youtube.com/watch?v=VIDEO_ID"
   ---

   **0:00** Primera linea en español
   **0:05.320** Segunda linea en español
   ```

**Requirements:**
- `yt-dlp` must be installed and in PATH
- Firefox browser with cookies (for `--cookies-from-browser`)
- Video must have Spanish auto-generated captions available

**Error handling:**
- If transcript already exists → report and skip
- If no Spanish subtitles → report failure
- If yt-dlp not installed → report missing dependency

---

**Ready to work! Just say:**
- `"download VIDEO_ID"` - Download Spanish transcript from YouTube
- `"translate new"` - Translate all new transcripts (asks for grammar sentence count: 3, 4, 5, or custom)
- `"merge VIDEO_ID"` - Merge short transcript lines into longer segments (80-120 chars)
- `"check files"` - Run validation and cleanup
- `"delete VIDEO_ID"` or `"remove VIDEO_ID"` - Remove a transcript

**Remember:** Every translation automatically:
1. Extracts multi-word phrases (2-4 words) as primary vocabulary
2. Creates grammar sentences with B1+ structures (subjunctive, compound tenses, etc.) - **you choose the count (3-5 or custom)**
3. Provides English translations and brief grammar explanations

---

## Final Note

**When in doubt, include the word/phrase.** This ensures **no important vocabulary is missed**, even if it means slightly more entries to review later.
