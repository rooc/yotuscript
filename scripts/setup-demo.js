#!/usr/bin/env node
/**
 * Setup demo data for new users.
 *
 * Creates sample transcripts and all required data files so the app works
 * immediately after cloning the repo.
 *
 * Usage:
 *   node scripts/setup-demo.js
 */

const fs = require('fs');
const path = require('path');
const { TRANSCRIPTS_DIR, VOCAB_DIR, GRAMMAR_DIR, SUMMARY_DIR, DATA_DIR } = require('../src/config');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created: ${dir}`);
    }
}

function writeJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Created: ${filePath}`);
}

function writeFile(filePath, content) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Created: ${filePath}`);
}

// Sample transcript 1: Short demo video
const sampleTranscript1 = `---
title: "Demo: Introducción al Español"
source: https://www.youtube.com/watch?v=demo1234567
---

**0:00** Hola a todos y bienvenidos a este video de demostración. Hoy vamos a aprender
**0:10** algunas frases básicas en español que son muy útiles para principiantes.
**0:20** La primera frase es "Buenos días" que significa good morning. Se usa por la mañana.
**0:30** La segunda frase es "¿Cómo estás?" que significa how are you. Es muy común.
**0:40** La tercera frase es "Muchas gracias" que significa thank you very much.
**0:50** Espero que este video de demostración te sea útil. ¡Nos vemos pronto!
`;

const sampleTranslation1 = `---
title: "Demo: Introducción al Español"
source: https://www.youtube.com/watch?v=demo1234567
---

**0:00** Hello everyone and welcome to this demo video. Today we're going to learn
**0:10** some basic phrases in Spanish that are very useful for beginners.
**0:20** The first phrase is "Buenos días" which means good morning. It's used in the morning.
**0:30** The second phrase is "¿Cómo estás?" which means how are you. It's very common.
**0:40** The third phrase is "Muchas gracias" which means thank you very much.
**0:50** I hope this demo video is useful for you. See you soon!
`;

const sampleVocab1 = {
    "buenos días": {
        "translation": "good morning",
        "pos": "expression",
        "context": "Buenos días se usa por la mañana."
    },
    "cómo estás": {
        "translation": "how are you",
        "pos": "expression",
        "context": "¿Cómo estás? Es muy común."
    },
    "muchas gracias": {
        "translation": "thank you very much",
        "pos": "expression",
        "context": "Muchas gracias por tu ayuda."
    },
    "principiante": {
        "translation": "beginner",
        "pos": "noun",
        "context": "frases útiles para principiantes"
    },
    "espero que": {
        "translation": "I hope that",
        "pos": "expression",
        "context": "Espero que este video te sea útil."
    }
};

const sampleGrammar1 = [
    {
        "spanish": "Espero que este video de demostración te sea útil.",
        "english": "I hope that this demo video is useful for you.",
        "explanation": "Uses the present subjunctive 'sea' after the expression 'espero que' to express a wish or hope."
    },
    {
        "spanish": "Hoy vamos a aprender algunas frases básicas en español.",
        "english": "Today we're going to learn some basic phrases in Spanish.",
        "explanation": "Uses the construction 'ir a + infinitive' (vamos a aprender) to express a future plan or intention."
    },
    {
        "spanish": "La primera frase es 'Buenos días' que significa good morning.",
        "english": "The first phrase is 'Good morning' which means good morning.",
        "explanation": "Uses the relative pronoun 'que' to introduce a defining clause that explains what the phrase means."
    }
];

const sampleSummary1 = {
    "summary": "Este video de demostración enseña frases básicas en español para principiantes, incluyendo 'Buenos días', '¿Cómo estás?' y 'Muchas gracias'. Es un ejemplo corto para mostrar cómo funciona la aplicación."
};

// Sample transcript 2: Intermediate level
const sampleTranscript2 = `---
title: "Demo: Viajar por España"
source: https://www.youtube.com/watch?v=demo7654321
---

**0:00** El año pasado tuve la oportunidad de viajar a España por primera vez.
**0:12** Fue una experiencia increíble que nunca voy a olvidar. Visité Madrid,
**0:23** Barcelona y Sevilla. Cada ciudad tenía su propio encanto y características únicas.
**0:35** En Madrid me impresionó mucho el Museo del Prado y la Plaza Mayor.
**0:46** La comida española es deliciosa. Probé la paella, las tapas y el gazpacho.
**0:58** Recomiendo a todos los estudiantes de español que visiten España alguna vez.
**1:10** No solo mejorarán su español, sino que también conocerán una cultura fascinante.
**1:22** España tiene una historia muy rica y la gente es muy acogedora con los turistas.
`;

const sampleTranslation2 = `---
title: "Demo: Viajar por España"
source: https://www.youtube.com/watch?v=demo7654321
---

**0:00** Last year I had the opportunity to travel to Spain for the first time.
**0:12** It was an incredible experience that I'll never forget. I visited Madrid,
**0:23** Barcelona and Seville. Each city had its own charm and unique characteristics.
**0:35** In Madrid I was very impressed by the Prado Museum and the Plaza Mayor.
**0:46** Spanish food is delicious. I tried paella, tapas and gazpacho.
**0:58** I recommend to all Spanish students that they visit Spain sometime.
**1:10** Not only will they improve their Spanish, but they will also get to know a fascinating culture.
**1:22** Spain has a very rich history and the people are very welcoming to tourists.
`;

const sampleVocab2 = {
    "oportunidad de": {
        "translation": "opportunity to",
        "pos": "noun phrase",
        "context": "tuve la oportunidad de viajar"
    },
    "por primera vez": {
        "translation": "for the first time",
        "pos": "expression",
        "context": "viajar a España por primera vez"
    },
    "nunca voy a olvidar": {
        "translation": "I'll never forget",
        "pos": "expression",
        "context": "una experiencia que nunca voy a olvidar"
    },
    "encanto": {
        "translation": "charm",
        "pos": "noun",
        "context": "Cada ciudad tenía su propio encanto"
    },
    "me impresionó": {
        "translation": "impressed me / I was impressed",
        "pos": "verb phrase",
        "context": "me impresionó mucho el Museo del Prado"
    },
    "recomiendo a": {
        "translation": "I recommend to",
        "pos": "verb phrase",
        "context": "Recomiendo a todos los estudiantes"
    },
    "no solo sino que": {
        "translation": "not only but also",
        "pos": "expression",
        "context": "No solo mejorarán su español, sino que también conocerán"
    },
    "acogedora": {
        "translation": "welcoming",
        "pos": "adjective",
        "context": "la gente es muy acogedora"
    }
};

const sampleGrammar2 = [
    {
        "spanish": "El año pasado tuve la oportunidad de viajar a España por primera vez.",
        "english": "Last year I had the opportunity to travel to Spain for the first time.",
        "explanation": "Uses the preterite tense 'tuve' to describe a completed action at a specific point in the past."
    },
    {
        "spanish": "Fue una experiencia increíble que nunca voy a olvidar.",
        "english": "It was an incredible experience that I'll never forget.",
        "explanation": "Uses the future tense 'voy a olvidar' with 'nunca' to express a future intention of never forgetting."
    },
    {
        "spanish": "Recomiendo a todos los estudiantes de español que visiten España alguna vez.",
        "english": "I recommend to all Spanish students that they visit Spain sometime.",
        "explanation": "Uses the present subjunctive 'visiten' after the verb 'recomendar' to express a recommendation or suggestion."
    }
];

const sampleSummary2 = {
    "summary": "Este video de demostración intermedio habla sobre viajar a España por primera vez. Menciona ciudades como Madrid, Barcelona y Sevilla, la comida española y recomienda a estudiantes de español visitar el país para mejorar su idioma y conocer la cultura."
};

// Required data files
const a1a2Data = {
    "description": "A1-A2 level Spanish words to exclude from vocabulary extraction",
    "excludedWords": [
        "a", "al", "algo", "algún", "alguna", "algunas", "alguno", "algunos",
        "allí", "ante", "antes", "aquel", "aquella", "aquellas", "aquellos", "aquí",
        "así", "aun", "aún", "aunque", "ayer",
        "bajo", "bastante", "bastantes", "bien", "buen", "buena", "buenas", "bueno", "buenos",
        "cada", "casi", "cierta", "ciertas", "cierto", "ciertos", "cinco", "claro", "como", "cómo",
        "con", "conmigo", "contigo", "contra", "cosa", "cosas", "cual", "cuál", "cuales", "cuándo",
        "cuando", "cuanta", "cuánta", "cuantas", "cuántas", "cuanto", "cuánto", "cuantos", "cuántos",
        "de", "deber", "debajo", "del", "delante", "demasiada", "demasiadas", "demasiado", "demasiados",
        "dentro", "desde", "después", "detrás", "día", "días", "diez", "dos", "durante",
        "e", "el", "ella", "ellas", "ello", "ellos", "en", "encima", "entonces", "entre",
        "era", "eran", "eras", "es", "esa", "esas", "ese", "eses", "eso", "esos", "esta", "estas",
        "este", "estes", "esto", "estos",
        "fácil", "fue", "fueron",
        "grande", "grandes",
        "ha", "había", "habían", "han", "has", "hasta", "hay", "he", "hemos", "hoy",
        "iba", "iban", "igual", "incluso",
        "jamás",
        "la", "lado", "las", "le", "les", "lo", "los", "luego",
        "mal", "más", "me", "menos", "mi", "mía", "mias", "mientras", "mis", "misma", "mismas",
        "mismo", "mismos", "modo", "mucha", "muchas", "mucho", "muchos", "muy",
        "nada", "nadie", "ni", "ningún", "ninguna", "ninguno", "no", "nos", "nosotras", "nosotros",
        "nuestra", "nuestras", "nuestro", "nuestros", "nueva", "nuevas", "nuevo", "nuevos", "nunca",
        "o", "os", "otra", "otras", "otro", "otros",
        "para", "pero", "poco", "pocos", "podemos", "poder", "puede", "pueden", "puedes", "pues",
        "que", "qué", "quien", "quién", "quienes",
        "sí", "sin", "sino", "sobre", "solamente", "solo", "sólo", "somos", "son", "soy", "su", "sus",
        "suya", "suyas", "suyo", "suyos",
        "tal", "también", "tampoco", "tan", "tanta", "tantas", "tanto", "tantos", "te", "temprano",
        "tiene", "tienen", "tienes", "tiempo", "tienda", "todas", "todavía", "todo", "todos", "tomar",
        "trabajar", "trabajo", "tras", "tú", "tu", "tus", "tuya", "tuyas", "tuyo", "tuyos",
        "un", "una", "unas", "uno", "unos", "usted", "ustedes",
        "va", "vamos", "van", "varias", "varios", "veces", "ver", "vez", "vosotras", "vosotros",
        "vuestra", "vuestras", "vuestro", "vuestros",
        "ya", "yo"
    ]
};

const properNounsData = {
    "description": "Country names and common human names to exclude from vocab generation",
    "countries": [
        "españa", "méxico", "estados unidos", "argentina", "francia", "italia", "alemania",
        "inglaterra", "colombia", "japón", "china", "brasil", "canadá", "australia"
    ],
    "humanNames": [
        "maría", "juan", "josé", "ana", "luis", "carlos", "andrea", "pedro", "laura",
        "agustina", "shell", "sebastián", "lucy"
    ]
};

const manualExcludeData = {
    "description": "Manual exclusions for vocabulary",
    "words": [
        "podcast", "español", "okay", "tren", "internet", "video", "audio", "tiktok",
        "iphone", "apple", "samsung", "google", "youtube", "facebook", "instagram"
    ]
};

const learnedData = {
    "learnedVideos": [],
    "learnedPanelCollapsed": true
};

const progressData = {};

const statsData = {
    "totalLearned": 0,
    "totalWatchTimeHours": 0
};

const vocabularData = {
    "vocabularWords": [],
    "vocabularPanelCollapsed": true
};

function main() {
    console.log('Setting up demo data for Yotuscript...\n');
    console.log(`Data root: ${path.dirname(TRANSCRIPTS_DIR)}\n`);

    // Create directories
    ensureDir(TRANSCRIPTS_DIR);
    ensureDir(VOCAB_DIR);
    ensureDir(GRAMMAR_DIR);
    ensureDir(SUMMARY_DIR);
    ensureDir(DATA_DIR);

    // Check if demo data already exists
    const demo1Exists = fs.existsSync(path.join(TRANSCRIPTS_DIR, 'demo1234567.md'));
    const demo2Exists = fs.existsSync(path.join(TRANSCRIPTS_DIR, 'demo7654321.md'));

    if (demo1Exists && demo2Exists && !process.argv.includes('--force')) {
        console.log('\nDemo data already exists!');
        console.log('Use --force to recreate.');
        process.exit(0);
    }

    // Write sample transcript 1
    writeFile(path.join(TRANSCRIPTS_DIR, 'demo1234567.md'), sampleTranscript1);
    writeFile(path.join(TRANSCRIPTS_DIR, 'demo1234567_translation.md'), sampleTranslation1);
    writeJson(path.join(VOCAB_DIR, 'demo1234567_vocab.json'), sampleVocab1);
    writeJson(path.join(GRAMMAR_DIR, 'demo1234567_grammar.json'), sampleGrammar1);
    writeJson(path.join(SUMMARY_DIR, 'demo1234567_summary.json'), sampleSummary1);

    // Write sample transcript 2
    writeFile(path.join(TRANSCRIPTS_DIR, 'demo7654321.md'), sampleTranscript2);
    writeFile(path.join(TRANSCRIPTS_DIR, 'demo7654321_translation.md'), sampleTranslation2);
    writeJson(path.join(VOCAB_DIR, 'demo7654321_vocab.json'), sampleVocab2);
    writeJson(path.join(GRAMMAR_DIR, 'demo7654321_grammar.json'), sampleGrammar2);
    writeJson(path.join(SUMMARY_DIR, 'demo7654321_summary.json'), sampleSummary2);

    // Write required data files
    writeJson(path.join(DATA_DIR, 'a1-a2.json'), a1a2Data);
    writeJson(path.join(DATA_DIR, 'proper-nouns.json'), properNounsData);
    writeJson(path.join(DATA_DIR, 'manual-exclude.json'), manualExcludeData);
    writeJson(path.join(DATA_DIR, 'learned.json'), learnedData);
    writeJson(path.join(DATA_DIR, 'progress.json'), progressData);
    writeJson(path.join(DATA_DIR, 'stats.json'), statsData);
    writeJson(path.join(DATA_DIR, 'vocabular.json'), vocabularData);

    console.log('\n✅ Demo data setup complete!');
    console.log('\nYou can now:');
    console.log('  1. Start the server: node server.js');
    console.log('  2. Open: http://localhost:9090');
    console.log('  3. Try the demo transcripts: demo1234567 and demo7654321');
    console.log('\nTo add real transcripts, use: node scripts/download.js VIDEO_ID');
}

main();
