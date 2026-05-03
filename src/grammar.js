/**
 * Spanish verb form detector.
 *
 * Uses ending-based heuristics to identify the tense/mood of conjugated verbs.
 * Not 100% accurate (Spanish conjugation is complex) but covers the most
 * common forms learners encounter.
 *
 * Returns an abbreviated grammar label like "pres.", "pret.", "impf. subj."
 * or null if the word doesn't look like a verb form.
 */

/**
 * @param {string} word
 * @returns {string | null}
 */
function detectVerbForm(word) {
	const w = word.toLowerCase();

	// Infinitive
	if (/[aei]r$/.test(w) && w.length > 2) {
		return 'inf.';
	}

	// Gerund (-ando / -iendo / -yendo)
	if (/((?:i|y|a)endo)$/.test(w) || /ando$/.test(w)) {
		return 'gerund';
	}

	// Past participle (-ado / -ido / -to / -so / -cho for irregulars)
	if (/((?:ad|id|t|s|ch)o)$/.test(w) && w.length > 3) {
		return 'past part.';
	}

	// Imperfect subjunctive (-ra / -se endings)
	if (/((?:ra|se)(?:s|n)?)$/.test(w) && w.length > 4) {
		return 'impf. subj.';
	}

	// Future (infinitive + endings: -é, -ás, -á, -emos, -éis, -án)
	if (/r((?:é|ás|á|emos|éis|án))$/.test(w)) {
		return 'fut.';
	}

	// Conditional (infinitive + endings: -ía, -ías, -íamos, -íais, -ían)
	if (/r((?:ía(?:s|mos|is|n)?))$/.test(w)) {
		return 'cond.';
	}

	// Imperfect indicative (-aba for -ar, -ía for -er/-ir)
	if (/aba(?:s|mos|is|n)?$/.test(w) || /ía(?:s|mos|is|n)?$/.test(w)) {
		return 'impf.';
	}

	// Preterite (distinctive endings)
	if (
		/[aeiou]é$/.test(w) || // -é
		/aste(?:s|mos|is)?$/.test(w) || // -aste
		/[aeiou]ó$/.test(w) || // -ó
		/amos$/.test(w) || // -amos (ambiguous with present, but preterite -ar is common)
		/aron$/.test(w) || // -aron
		/[aeiou]ste(?:s|mos|is)?$/.test(w) || // -iste/-isteis
		/ieron$/.test(w) // -ieron
	) {
		return 'pret.';
	}

	// Present subjunctive (loose but distinctive)
	if (
		/(?:gue|que|ce|gue|je)(?:s|mos|is|n)?$/.test(w) || // spelling changes
		/(?:e|a)(?:s|mos|is|n)?$/.test(w)
	) {
		// Avoid false positives on very short words or obvious non-verbs
		if (w.length > 3 && !/^(el|la|un|una|es|en|de)$/.test(w)) {
			// Heuristic: subjunctive often follows "que", "si", "cuando" in context
			// We can't know context here, so we mark it tentatively
			return 'pres. subj.';
		}
	}

	// Imperative (commands)
	if (
		/(?:a|e)(?:d|n)?$/.test(w) ||
		/(?:ad|ed|id)$/.test(w)
	) {
		if (w.length > 2) {
			return 'imper.';
		}
	}

	// Present indicative (catch-all for remaining verb-like endings)
	if (
		/o$/.test(w) || // 1st person singular
		/es$/.test(w) || // 2nd/3rd person
		/e$/.test(w) || // 3rd person -er/-ir
		/en$/.test(w) || // 3rd person plural
		/imos$/.test(w) || // 1st person plural -ir
		/ís$/.test(w) || // 2nd person plural
		/áis$/.test(w) // 2nd person plural -ar
	) {
		if (w.length > 2) {
			return 'pres.';
		}
	}

	return null;
}

module.exports = { detectVerbForm };
