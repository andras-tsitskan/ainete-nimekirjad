// ── lausepank-andmed.js ──────────────────────────────────────────────────────────
// Snippet data for lausepank.html.
// Edit this file to add, remove or modify snippets and categories.
//
// Field reference:
//   id        — unique integer, never reuse
//   category  — string, exact match groups snippets visually
//   tags      — array of strings, used for cross-category filtering
//   text      — the snippet text, copied verbatim to clipboard
//   comment   — optional string, explanation of phrasing or context
//
// Special characters in text:
//   Non-breaking space : \u00a0  (or paste directly)
//   Superscript 1      : \u00b9  ¹
//   Superscript 2      : \u00b2  ²
//   Superscript 3      : \u00b3  ³
//   Superscript 4–9    : \u2074–\u2079  ⁴ ⁵ ⁶ ⁷ ⁸ ⁹
//   Superscript 0      : \u2070  ⁰
//
// Example: 'KarS\u00a0§\u00a073 lg\u00b9 alusel' → 'KarS § 73 lg¹ alusel'
// ─────────────────────────────────────────────────────────────────────────────

export const SNIPPETS = [
  // ── KarS § 73 katseaeg ────────────────────────────────────────────────────
  {
    id: 1,
    category: "KarS\u00a0§\u00a073 katseaeg",
    tags: ["katseaeg", "tingimisi"],
    text: "Mõista süüdistatavale KarS\u00a0§\u00a073 lg\u00b9 alusel tingimisi karistus katseajaga [X]\u00a0aastat.",
    comment:
      "Põhivorm tingimisi karistuse mõistmiseks. Katseaeg määratakse aastate täpsusega.",
  },
  {
    id: 2,
    category: "KarS\u00a0§\u00a073 katseaeg",
    tags: ["katseaeg", "tingimisi", "kohustus", "allkirjastamine"],
    text: "Panna süüdistatavale KarS\u00a0§\u00a073 lg\u00b3 alusel katseaja kestel kohustus allkirjastada kriminaalhoolduse eeskirjad ja täita neid.",
    comment: null,
  },
  {
    id: 3,
    category: "KarS\u00a0§\u00a073 katseaeg",
    tags: ["katseaeg", "tingimisi", "keeld", "alkohol"],
    text: "Panna süüdistatavale katseaja kestel kohustus hoiduda alkoholi ja muude joovastava toimega ainete tarvitamisest.",
    comment: null,
  },
  {
    id: 4,
    category: "KarS\u00a0§\u00a073 katseaeg",
    tags: ["katseaeg", "tingimisi", "keeld", "lahkumine"],
    text: "Keelata süüdistataval katseaja kestel Eesti Vabariigi territooriumilt lahkumine ilma kriminaalhooldusametniku loata.",
    comment: null,
  },
  {
    id: 5,
    category: "KarS\u00a0§\u00a073 katseaeg",
    tags: ["katseaeg", "tingimisi", "kohustus", "aruandlus"],
    text: "Panna süüdistatavale katseaja kestel kohustus ilmuda kriminaalhooldusametniku juurde tema poolt määratud ajal ja kohas.",
    comment: null,
  },

  // ── KarS § 74 katseaeg ────────────────────────────────────────────────────
  {
    id: 6,
    category: "KarS\u00a0§\u00a074 katseaeg",
    tags: ["katseaeg", "tingimisi", "osaline", "vangistus"],
    text: "Mõista süüdistatavale KarS\u00a0§\u00a074 lg\u00b9 alusel [X]\u00a0aastat [Y]\u00a0kuud vangistust, millest [Z]\u00a0kuud mõista reaalselt ja ülejäänud osa tingimisi katseajaga [N]\u00a0aastat.",
    comment:
      "Osalise tingimisi karistuse põhivorm. Reaalne ja tingimisi osa peavad koos moodustama kogusumma.",
  },
  {
    id: 7,
    category: "KarS\u00a0§\u00a074 katseaeg",
    tags: ["katseaeg", "tingimisi", "osaline", "kohustus"],
    text: "Panna süüdistatavale KarS\u00a0§\u00a074 lg\u00b3 alusel tingimisi osa katseaja kestel kohustus allkirjastada kriminaalhoolduse eeskirjad ja täita neid.",
    comment: null,
  },
  {
    id: 8,
    category: "KarS\u00a0§\u00a074 katseaeg",
    tags: ["katseaeg", "tingimisi", "osaline", "keeld", "alkohol"],
    text: "Panna süüdistatavale katseaja kestel kohustus hoiduda alkoholi ja narkootiliste ainete tarvitamisest ning alluda vastavale kontrollile.",
    comment: null,
  },

  // ── Reaalne vangistus ─────────────────────────────────────────────────────
  {
    id: 9,
    category: "Reaalne vangistus",
    tags: ["vangistus", "reaalne", "tähtaeg"],
    text: "Mõista süüdistatavale karistuseks [X]\u00a0aastat [Y]\u00a0kuud vangistust.",
    comment: null,
  },
  {
    id: 10,
    category: "Reaalne vangistus",
    tags: ["vangistus", "reaalne", "eelvangistus"],
    text: "Lugeda süüdistatava vahi all viibitud aeg [KP.KK.AAAA]–[KP.KK.AAAA] karistusaega arvatuks.",
    comment:
      "Eelvangistus arvestatakse karistusaja hulka KarS\u00a0§\u00a0101 alusel. Kuupäevad märkida vahi alla võtmise ja vabastamise kuupäevadena.",
  },
  {
    id: 11,
    category: "Reaalne vangistus",
    tags: ["vangistus", "reaalne", "liitkaristus"],
    text: "Liita KarS\u00a0§\u00a065 lg\u00b9 alusel käesoleva kohtuotsusega mõistetud karistus süüdistatavale [kohtuotsus] alusel mõistetud karistusega ning mõista lõplikuks karistuseks [X]\u00a0aastat [Y]\u00a0kuud vangistust.",
    comment:
      "Kasutatakse, kui isikul on mitu samaaegset karistust, mis liidetakse üheks.",
  },
  {
    id: 12,
    category: "Reaalne vangistus",
    tags: ["vangistus", "reaalne", "algus"],
    text: "Karistuse kandmist alustada kohtuotsuse jõustumisest.",
    comment: null,
  },

  // ── Rahaline karistus ─────────────────────────────────────────────────────
  {
    id: 13,
    category: "Rahaline karistus",
    tags: ["rahaline", "trahv", "päevamäär"],
    text: "Mõista süüdistatavale karistuseks [X]\u00a0päevamäära suurune rahaline karistus, arvestades päevamääraks [Y]\u00a0eurot, kokku [Z]\u00a0eurot.",
    comment:
      "Päevamäär arvutatakse süüdistatava keskmise päevasissetuleku alusel. KarS\u00a0§\u00a044 lg\u00b2.",
  },
  {
    id: 14,
    category: "Rahaline karistus",
    tags: ["rahaline", "trahv", "päevamäär", "tingimisi"],
    text: "Mõista süüdistatavale KarS\u00a0§\u00a073 lg\u00b9 alusel tingimisi rahaline karistus [X]\u00a0päevamäära ulatuses katseajaga [Y]\u00a0aastat.",
    comment: null,
  },
  {
    id: 15,
    category: "Rahaline karistus",
    tags: ["rahaline", "tähtaeg", "tasumine"],
    text: "Kohustada süüdistatavat tasuma rahaline karistus [X]\u00a0kuu jooksul kohtuotsuse jõustumisest.",
    comment: null,
  },

  // ── Menetluskulud ─────────────────────────────────────────────────────────
  {
    id: 16,
    category: "Menetluskulud",
    tags: ["menetlus", "kulud"],
    text: "Mõista süüdistatavalt riigi tuludesse menetluskulud [X]\u00a0eurot.",
    comment: null,
  },
  {
    id: 17,
    category: "Menetluskulud",
    tags: ["menetlus", "kulud", "kaitsja"],
    text: "Jätta riigi õigusabi kulude hüvitamise nõue lahendamata, kuna kaitsja on jätnud KrMS\u00a0§\u00a0175 lg\u00b2 kohase taotluse esitamata.",
    comment:
      "Kasutatakse, kui riigi õigusabi osutanud kaitsja ei ole esitanud kulude nimekirja KrMS\u00a0§\u00a0175 lg\u00b2 nõuete kohaselt.",
  },
  {
    id: 18,
    category: "Menetluskulud",
    tags: ["menetlus", "kulud", "vabastus"],
    text: "Vabastada süüdistatav menetluskulude hüvitamisest KrMS\u00a0§\u00a0181 lg\u00b9 alusel, arvestades tema varalist seisundit.",
    comment: null,
  },
];
