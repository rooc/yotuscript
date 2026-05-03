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
 * Lookup table for common irregular verb forms.
 * Maps specific conjugated forms directly to their tense label.
 * Checked before ending-based heuristics.
 */
const IRREGULAR_VERBS = {
	// SER / IR (pretérito, imperfecto, subjuntivo, imperativo)
	fui: 'pret.', fuiste: 'pret.', fue: 'pret.', fuimos: 'pret.', fuisteis: 'pret.', fueron: 'pret.',
	era: 'impf.', eras: 'impf.', éramos: 'impf.', erais: 'impf.', eran: 'impf.',
	sea: 'pres. subj.', seas: 'pres. subj.', seamos: 'pres. subj.', seáis: 'pres. subj.', sean: 'pres. subj.',
	fuera: 'impf. subj.', fueras: 'impf. subj.', fuéramos: 'impf. subj.', fuerais: 'impf. subj.', fueran: 'impf. subj.',
	fuese: 'impf. subj.', fueses: 'impf. subj.', fuésemos: 'impf. subj.', fueseis: 'impf. subj.', fuesen: 'impf. subj.',
	soy: 'pres.', eres: 'pres.', es: 'pres.', somos: 'pres.', sois: 'pres.', son: 'pres.',
	// IR (presente, imperfecto, futuro, condicional)
	voy: 'pres.', vas: 'pres.', va: 'pres.', vamos: 'pres.', vais: 'pres.', van: 'pres.',
	iba: 'impf.', ibas: 'impf.', íbamos: 'impf.', ibais: 'impf.', iban: 'impf.',
	vaya: 'pres. subj.', vayas: 'pres. subj.', vayamos: 'pres. subj.', vayáis: 'pres. subj.', vayan: 'pres. subj.',
	// ESTAR
	estoy: 'pres.', estás: 'pres.', está: 'pres.', estamos: 'pres.', estáis: 'pres.', están: 'pres.',
	estuve: 'pret.', estuviste: 'pret.', estuvo: 'pret.', estuvimos: 'pret.', estuvisteis: 'pret.', estuvieron: 'pret.',
	estaba: 'impf.', estabas: 'impf.', estábamos: 'impf.', estabais: 'impf.', estaban: 'impf.',
	esté: 'pres. subj.', estés: 'pres. subj.', estemos: 'pres. subj.', estéis: 'pres. subj.', estén: 'pres. subj.',
	estuviera: 'impf. subj.', estuvieras: 'impf. subj.', estuviéramos: 'impf. subj.', estuvierais: 'impf. subj.', estuvieran: 'impf. subj.',
	estuviese: 'impf. subj.', estuvieses: 'impf. subj.', estuviésemos: 'impf. subj.', estuvieseis: 'impf. subj.', estuviesen: 'impf. subj.',
	// TENER
	tengo: 'pres.', tienes: 'pres.', tiene: 'pres.', tenemos: 'pres.', tenéis: 'pres.', tienen: 'pres.',
	tuve: 'pret.', tuviste: 'pret.', tuvo: 'pret.', tuvimos: 'pret.', tuvisteis: 'pret.', tuvieron: 'pret.',
	tenía: 'impf.', tenías: 'impf.', teníamos: 'impf.', teníais: 'impf.', tenían: 'impf.',
	tenga: 'pres. subj.', tengas: 'pres. subj.', tengamos: 'pres. subj.', tengáis: 'pres. subj.', tengan: 'pres. subj.',
	tuviera: 'impf. subj.', tuvieras: 'impf. subj.', tuviéramos: 'impf. subj.', tuvierais: 'impf. subj.', tuvieran: 'impf. subj.',
	tuviese: 'impf. subj.', tuvieses: 'impf. subj.', tuviésemos: 'impf. subj.', tuvieseis: 'impf. subj.', tuviesen: 'impf. subj.',
	// HACER
	hago: 'pres.', haces: 'pres.', hace: 'pres.', hacemos: 'pres.', hacéis: 'pres.', hacen: 'pres.',
	hice: 'pret.', hiciste: 'pret.', hizo: 'pret.', hicimos: 'pret.', hicisteis: 'pret.', hicieron: 'pret.',
	hacía: 'impf.', hacías: 'impf.', hacíamos: 'impf.', hacíais: 'impf.', hacían: 'impf.',
	haga: 'pres. subj.', hagas: 'pres. subj.', hagamos: 'pres. subj.', hagáis: 'pres. subj.', hagan: 'pres. subj.',
	hiciera: 'impf. subj.', hicieras: 'impf. subj.', hiciéramos: 'impf. subj.', hicierais: 'impf. subj.', hicieran: 'impf. subj.',
	hiciese: 'impf. subj.', hicieses: 'impf. subj.', hiciésemos: 'impf. subj.', hicieseis: 'impf. subj.', hiciesen: 'impf. subj.',
	// DECIR
	digo: 'pres.', dices: 'pres.', dice: 'pres.', decimos: 'pres.', decís: 'pres.', dicen: 'pres.',
	dije: 'pret.', dijiste: 'pret.', dijo: 'pret.', dijimos: 'pret.', dijisteis: 'pret.', dijeron: 'pret.',
	decía: 'impf.', decías: 'impf.', decíamos: 'impf.', decíais: 'impf.', decían: 'impf.',
	diga: 'pres. subj.', digas: 'pres. subj.', digamos: 'pres. subj.', digáis: 'pres. subj.', digan: 'pres. subj.',
	dijera: 'impf. subj.', dijeras: 'impf. subj.', dijéramos: 'impf. subj.', dijerais: 'impf. subj.', dijeran: 'impf. subj.',
	dijese: 'impf. subj.', dijeses: 'impf. subj.', dijésemos: 'impf. subj.', dijeseis: 'impf. subj.', dijesen: 'impf. subj.',
	// PODER
	puedo: 'pres.', puedes: 'pres.', puede: 'pres.', podemos: 'pres.', podéis: 'pres.', pueden: 'pres.',
	pude: 'pret.', pudiste: 'pret.', pudo: 'pret.', pudimos: 'pret.', pudisteis: 'pret.', pudieron: 'pret.',
	podía: 'impf.', podías: 'impf.', podíamos: 'impf.', podíais: 'impf.', podían: 'impf.',
	pueda: 'pres. subj.', puedas: 'pres. subj.', podamos: 'pres. subj.', podáis: 'pres. subj.', puedan: 'pres. subj.',
	pudiera: 'impf. subj.', pudieras: 'impf. subj.', pudiéramos: 'impf. subj.', pudierais: 'impf. subj.', pudieran: 'impf. subj.',
	pudiese: 'impf. subj.', pudieses: 'impf. subj.', pudiésemos: 'impf. subj.', pudieseis: 'impf. subj.', pudiesen: 'impf. subj.',
	// PONER
	pongo: 'pres.', pones: 'pres.', pone: 'pres.', ponemos: 'pres.', ponéis: 'pres.', ponen: 'pres.',
	puse: 'pret.', pusiste: 'pret.', puso: 'pret.', pusimos: 'pret.', pusisteis: 'pret.', pusieron: 'pret.',
	ponía: 'impf.', ponías: 'impf.', poníamos: 'impf.', poníais: 'impf.', ponían: 'impf.',
	ponga: 'pres. subj.', pongas: 'pres. subj.', pongamos: 'pres. subj.', pongáis: 'pres. subj.', pongan: 'pres. subj.',
	pusiera: 'impf. subj.', pusieras: 'impf. subj.', pusiéramos: 'impf. subj.', pusierais: 'impf. subj.', pusieran: 'impf. subj.',
	pusiese: 'impf. subj.', pusieses: 'impf. subj.', pusiésemos: 'impf. subj.', pusieseis: 'impf. subj.', pusiesen: 'impf. subj.',
	// VER
	veo: 'pres.', ves: 'pres.', ve: 'pres.', vemos: 'pres.', veis: 'pres.', ven: 'pres.',
	vi: 'pret.', viste: 'pret.', vio: 'pret.', vimos: 'pret.', visteis: 'pret.', vieron: 'pret.',
	veía: 'impf.', veías: 'impf.', veíamos: 'impf.', veíais: 'impf.', veían: 'impf.',
	vea: 'pres. subj.', veas: 'pres. subj.', veamos: 'pres. subj.', veáis: 'pres. subj.', vean: 'pres. subj.',
	viera: 'impf. subj.', vieras: 'impf. subj.', viéramos: 'impf. subj.', vierais: 'impf. subj.', vieran: 'impf. subj.',
	viese: 'impf. subj.', vieses: 'impf. subj.', viésemos: 'impf. subj.', vieseis: 'impf. subj.', viesen: 'impf. subj.',
	// DAR
	doy: 'pres.', das: 'pres.', da: 'pres.', damos: 'pres.', dais: 'pres.', dan: 'pres.',
	di: 'pret.', diste: 'pret.', dio: 'pret.', dimos: 'pret.', disteis: 'pret.', dieron: 'pret.',
	daba: 'impf.', dabas: 'impf.', dábamos: 'impf.', dabais: 'impf.', daban: 'impf.',
	dé: 'pres. subj.', des: 'pres. subj.', demos: 'pres. subj.', deis: 'pres. subj.', den: 'pres. subj.',
	diera: 'impf. subj.', dieras: 'impf. subj.', diéramos: 'impf. subj.', dierais: 'impf. subj.', dieran: 'impf. subj.',
	diese: 'impf. subj.', dieses: 'impf. subj.', diésemos: 'impf. subj.', dieseis: 'impf. subj.', diesen: 'impf. subj.',
	// SABER
	sé: 'pres.', sabes: 'pres.', sabe: 'pres.', sabemos: 'pres.', sabéis: 'pres.', saben: 'pres.',
	supe: 'pret.', supiste: 'pret.', supo: 'pret.', supimos: 'pret.', supisteis: 'pret.', supieron: 'pret.',
	sabía: 'impf.', sabías: 'impf.', sabíamos: 'impf.', sabíais: 'impf.', sabían: 'impf.',
	sepa: 'pres. subj.', sepas: 'pres. subj.', sepamos: 'pres. subj.', sepáis: 'pres. subj.', sepan: 'pres. subj.',
	supiera: 'impf. subj.', supieras: 'impf. subj.', supiéramos: 'impf. subj.', supierais: 'impf. subj.', supieran: 'impf. subj.',
	supiese: 'impf. subj.', supieses: 'impf. subj.', supiésemos: 'impf. subj.', supieseis: 'impf. subj.', supiesen: 'impf. subj.',
	// QUERER
	quiero: 'pres.', quieres: 'pres.', quiere: 'pres.', queremos: 'pres.', queréis: 'pres.', quieren: 'pres.',
	quise: 'pret.', quisiste: 'pret.', quiso: 'pret.', quisimos: 'pret.', quisisteis: 'pret.', quisieron: 'pret.',
	quería: 'impf.', querías: 'impf.', queríamos: 'impf.', queríais: 'impf.', querían: 'impf.',
	quiera: 'pres. subj.', quieras: 'pres. subj.', queramos: 'pres. subj.', queráis: 'pres. subj.', quieran: 'pres. subj.',
	quisiera: 'impf. subj.', quisieras: 'impf. subj.', quisiéramos: 'impf. subj.', quisierais: 'impf. subj.', quisieran: 'impf. subj.',
	// VENIR
	vengo: 'pres.', vienes: 'pres.', viene: 'pres.', venimos: 'pres.', venís: 'pres.', vienen: 'pres.',
	vine: 'pret.', viniste: 'pret.', vino: 'pret.', vinimos: 'pret.', vinisteis: 'pret.', vinieron: 'pret.',
	venía: 'impf.', venías: 'impf.', veníamos: 'impf.', veníais: 'impf.', venían: 'impf.',
	venga: 'pres. subj.', vengas: 'pres. subj.', vengamos: 'pres. subj.', vengáis: 'pres. subj.', vengan: 'pres. subj.',
	viniera: 'impf. subj.', vinieras: 'impf. subj.', viniéramos: 'impf. subj.', vinierais: 'impf. subj.', vinieran: 'impf. subj.',
	viniese: 'impf. subj.', vinieses: 'impf. subj.', viniésemos: 'impf. subj.', vinieseis: 'impf. subj.', viniesen: 'impf. subj.',
	// HABER (auxiliary)
	he: 'pres.', has: 'pres.', ha: 'pres.', hemos: 'pres.', habéis: 'pres.', han: 'pres.',
	hube: 'pret.', hubiste: 'pret.', hubo: 'pret.', hubimos: 'pret.', hubisteis: 'pret.', hubieron: 'pret.',
	había: 'impf.', habías: 'impf.', habíamos: 'impf.', habíais: 'impf.', habían: 'impf.',
	haya: 'pres. subj.', hayas: 'pres. subj.', hayamos: 'pres. subj.', hayáis: 'pres. subj.', hayan: 'pres. subj.',
	hubiera: 'impf. subj.', hubieras: 'impf. subj.', hubiéramos: 'impf. subj.', hubierais: 'impf. subj.', hubieran: 'impf. subj.',
	hubiese: 'impf. subj.', hubieses: 'impf. subj.', hubiésemos: 'impf. subj.', hubieseis: 'impf. subj.', hubiesen: 'impf. subj.',
	// TRAER
	traigo: 'pres.', traes: 'pres.', trae: 'pres.', traemos: 'pres.', traéis: 'pres.', traen: 'pres.',
	traje: 'pret.', trajiste: 'pret.', trajo: 'pret.', trajimos: 'pret.', trajisteis: 'pret.', trajeron: 'pret.',
	traía: 'impf.', traías: 'impf.', traíamos: 'impf.', traíais: 'impf.', traían: 'impf.',
	traiga: 'pres. subj.', traigas: 'pres. subj.', traigamos: 'pres. subj.', traigáis: 'pres. subj.', traigan: 'pres. subj.',
	trajera: 'impf. subj.', trajeras: 'impf. subj.', trajéramos: 'impf. subj.', trajerais: 'impf. subj.', trajeran: 'impf. subj.',
	trajese: 'impf. subj.', trajeses: 'impf. subj.', trajésemos: 'impf. subj.', trajeseis: 'impf. subj.', trajesen: 'impf. subj.',
	// CAER
	caigo: 'pres.', caes: 'pres.', cae: 'pres.', caemos: 'pres.', caéis: 'pres.', caen: 'pres.',
	caí: 'pret.', caíste: 'pret.', cayó: 'pret.', caímos: 'pret.', caísteis: 'pret.', cayeron: 'pret.',
	caía: 'impf.', caías: 'impf.', caíamos: 'impf.', caíais: 'impf.', caían: 'impf.',
	caiga: 'pres. subj.', caigas: 'pres. subj.', caigamos: 'pres. subj.', caigáis: 'pres. subj.', caigan: 'pres. subj.',
	cayera: 'impf. subj.', cayeras: 'impf. subj.', cayéramos: 'impf. subj.', cayerais: 'impf. subj.', cayeran: 'impf. subj.',
	cayese: 'impf. subj.', cayeras: 'impf. subj.', cayésemos: 'impf. subj.', cayeseis: 'impf. subj.', cayesen: 'impf. subj.',
	// OÍR
	oigo: 'pres.', oyes: 'pres.', oye: 'pres.', oímos: 'pres.', oís: 'pres.', oyen: 'pres.',
	oí: 'pret.', oíste: 'pret.', oyó: 'pret.', oímos: 'pret.', oísteis: 'pret.', oyeron: 'pret.',
	oía: 'impf.', oías: 'impf.', oíamos: 'impf.', oíais: 'impf.', oían: 'impf.',
	oiga: 'pres. subj.', oigas: 'pres. subj.', oigamos: 'pres. subj.', oigáis: 'pres. subj.', oigan: 'pres. subj.',
	oyera: 'impf. subj.', oyeras: 'impf. subj.', oyéramos: 'impf. subj.', oyerais: 'impf. subj.', oyeran: 'impf. subj.',
	oyese: 'impf. subj.', oyeses: 'impf. subj.', oyésemos: 'impf. subj.', oyesis: 'impf. subj.', oyesen: 'impf. subj.',
	// LEER
	leo: 'pres.', lees: 'pres.', lee: 'pres.', leemos: 'pres.', leéis: 'pres.', leen: 'pres.',
	leí: 'pret.', leíste: 'pret.', leyó: 'pret.', leímos: 'pret.', leísteis: 'pret.', leyeron: 'pret.',
	leía: 'impf.', leías: 'impf.', leíamos: 'impf.', leíais: 'impf.', leían: 'impf.',
	// CONSTRUIR
	construyo: 'pres.', construyes: 'pres.', construye: 'pres.', construimos: 'pres.', construís: 'pres.', construyen: 'pres.',
	construí: 'pret.', construiste: 'pret.', construyó: 'pret.', construimos: 'pret.', construisteis: 'pret.', construyeron: 'pret.',
	// SEGUIR
	sigo: 'pres.', sigues: 'pres.', sigue: 'pres.', seguimos: 'pres.', seguís: 'pres.', siguen: 'pres.',
	seguí: 'pret.', seguiste: 'pret.', siguió: 'pret.', seguimos: 'pret.', seguisteis: 'pret.', siguieron: 'pret.',
	seguía: 'impf.', seguías: 'impf.', seguíamos: 'impf.', seguíais: 'impf.', seguían: 'impf.',
	siga: 'pres. subj.', sigas: 'pres. subj.', sigamos: 'pres. subj.', sigáis: 'pres. subj.', sigan: 'pres. subj.',
	// CREER
	creo: 'pres.', crees: 'pres.', cree: 'pres.', creemos: 'pres.', creéis: 'pres.', creen: 'pres.',
	creí: 'pret.', creíste: 'pret.', creyó: 'pret.', creímos: 'pret.', creísteis: 'pret.', creyeron: 'pret.',
	// CONOCER
	conozco: 'pres.', conoces: 'pres.', conoce: 'pres.', conocemos: 'pres.', conocéis: 'pres.', conocen: 'pres.',
	conocí: 'pret.', conociste: 'pret.', conoció: 'pret.', conocimos: 'pret.', conocisteis: 'pret.', conocieron: 'pret.',
	conocía: 'impf.', conocías: 'impf.', conocíamos: 'impf.', conocíais: 'impf.', conocían: 'impf.',
	conozca: 'pres. subj.', conozcas: 'pres. subj.', conozcamos: 'pres. subj.', conozcáis: 'pres. subj.', conozcan: 'pres. subj.',
	// CONDUCIR
	conduzco: 'pres.', conduces: 'pres.', conduce: 'pres.', conducimos: 'pres.', conducís: 'pres.', conducen: 'pres.',
	conduje: 'pret.', condujiste: 'pret.', condujo: 'pret.', condujimos: 'pret.', condujisteis: 'pret.', condujeron: 'pret.',
	conducía: 'impf.', conducías: 'impf.', conducíamos: 'impf.', conducíais: 'impf.', conducían: 'impf.',
	conduzca: 'pres. subj.', conduzcas: 'pres. subj.', conduzcamos: 'pres. subj.', conduzcáis: 'pres. subj.', conduzcan: 'pres. subj.',
	// TRADUCIR
	traduzco: 'pres.', traduces: 'pres.', traduce: 'pres.', traducimos: 'pres.', traducís: 'pres.', traducen: 'pres.',
	traduje: 'pret.', tradujiste: 'pret.', tradujo: 'pret.', tradujimos: 'pret.', tradujisteis: 'pret.', tradujeron: 'pret.',
	traducía: 'impf.', traducías: 'impf.', traducíamos: 'impf.', traducíais: 'impf.', traducían: 'impf.',
	traduzca: 'pres. subj.', traduzcas: 'pres. subj.', traduzcamos: 'pres. subj.', traduzcáis: 'pres. subj.', traduzcan: 'pres. subj.',
	// PRODUCIR
	produzco: 'pres.', produces: 'pres.', produce: 'pres.', producimos: 'pres.', producís: 'pres.', producen: 'pres.',
	produje: 'pret.', produjiste: 'pret.', produjo: 'pret.', produjimos: 'pret.', produjisteis: 'pret.', produjeron: 'pret.',
	producía: 'impf.', producías: 'impf.', producíamos: 'impf.', producíais: 'impf.', producían: 'impf.',
	produzca: 'pres. subj.', produzcas: 'pres. subj.', produzcamos: 'pres. subj.', produzcáis: 'pres. subj.', produzcan: 'pres. subj.',
	// VALER
	valgo: 'pres.', vales: 'pres.', vale: 'pres.', valemos: 'pres.', valéis: 'pres.', valen: 'pres.',
	valía: 'impf.', valías: 'impf.', valíamos: 'impf.', valíais: 'impf.', valían: 'impf.',
	// SALIR
	salgo: 'pres.', sales: 'pres.', sale: 'pres.', salimos: 'pres.', salís: 'pres.', salen: 'pres.',
	salí: 'pret.', saliste: 'pret.', salió: 'pret.', salimos: 'pret.', salisteis: 'pret.', salieron: 'pret.',
	salía: 'impf.', salías: 'impf.', salíamos: 'impf.', salíais: 'impf.', salían: 'impf.',
	salga: 'pres. subj.', salgas: 'pres. subj.', salgamos: 'pres. subj.', salgáis: 'pres. subj.', salgan: 'pres. subj.',
};

/**
 * @param {string} word
 * @returns {string | null}
 */
function detectVerbForm(word) {
	const w = word.toLowerCase();

	// 1. Check irregular verbs first
	if (IRREGULAR_VERBS[w]) {
		return IRREGULAR_VERBS[w];
	}

	// 2. Fall back to ending-based heuristics
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

	// Filter out obvious non-verbs before applying conjugation heuristics
	if (
		/(able|ible|ente|ante|iente|mente|anza|encia|ancia|ología|ales|eros|eras|ores|ura|ura|dad|tad|tud|ción|sión|ez|eza)$/i.test(w) ||
		/^(el|la|lo|los|las|un|una|unos|unas|es|en|de|del|al|con|por|para|sin|sobre|tras|entre|desde|hasta|durante|según|mediante)$/i.test(w)
	) {
		return null;
	}

	// Present subjunctive — only match distinctive spelling-change stems
	// (e.g. llegue → llegar, busque → buscar, conozca → conocer, elija → elegir)
	if (/(gu|qu|zc|g|j)(e|a)(s|mos|is|n)?$/.test(w) && w.length > 4) {
		return 'pres. subj.';
	}

	// Imperative — only truly distinctive endings are -ad, -ed, -id (vosotros)
	// Other forms (-a, -e, -en, -an) overlap with present/subjunctive
	if (
		/(ad|ed|id)$/.test(w) &&
		w.length > 2 &&
		!/(idad|edad|dad|tad|tud|ción|sión|sad|lad)$/i.test(w)
	) {
		return 'imper.';
	}

	// Present indicative — tighter matching, avoid nouns/adjectives
	if (
		(/o$/.test(w) && !/(rio|cio|sio|mio|tio|nio|lio)$/i.test(w)) ||
		/es$/.test(w) ||
		/en$/.test(w) ||
		/emos$/.test(w) ||
		/imos$/.test(w) ||
		/áis$/.test(w) ||
		/ís$/.test(w)
	) {
		if (w.length > 2) {
			return 'pres.';
		}
	}

	return null;
}

module.exports = { detectVerbForm };
