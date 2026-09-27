import { file, glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "zod";

/**
 * Inhaltssammlungen (ADR-0006).
 *
 * Der Gewinn gegenueber Literalen im Code: Der Build bricht ab, wenn Daten gegen
 * das Schema verstossen. Ein Programmpunkt ohne Beginn oder mit vertauschten
 * Zeiten faellt hier auf und nicht erst vor dem falschen Raum.
 */

/** Wie belastbar ist ein Eintrag? Sichtbar in der Ansicht, nie nur farblich. */
const bestaetigung = z.enum(["bestaetigt", "vorlaeufig", "platzhalter"]);

/**
 * Spur, in der ein Punkt laeuft. Punkte derselben Spur zur selben Zeit sind
 * Alternativen zueinander - daraus leitet die Ansicht ab, dass man waehlen muss.
 */
const spur = z.enum(["haupt", "exkursion", "studium-generale", "rahmen"]);

/**
 * Lokale Zeit in Europe/Berlin, z. B. "2027-05-06T13:00".
 * Bewusst OHNE Zeitzonenangabe im Datenbestand: Das Orga-Team pflegt Ortszeit,
 * und eine falsch verstandene UTC-Angabe waere ein Fehler der Sorte, die erst
 * vor Ort auffaellt. Die Umrechnung passiert an einer Stelle im Code.
 */
const ortszeit = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Erwartet wird JJJJ-MM-TTTHH:MM (Ortszeit)");

/**
 * Die Orte der Tagung, an EINER Stelle gepflegt.
 *
 * Vorher standen Ort und Adresse als Freitext in drei Sammlungen - mit
 * 17 Schreibweisen fuer 12 Orte. "Novotel", "Novotel Hildesheim" und
 * "Novotel, Raum 2" waren dasselbe Haus, und die Adresse stand genau einmal
 * da, obwohl das Haus 36-mal im Programm vorkommt. Das verstiess gegen
 * Produktprinzip 2 und machte jede Kartenverknuepfung zum Gluecksspiel.
 *
 * Koordinaten sind freiwillig: Fuer die Weiterleitung an Karten-Apps genuegt
 * die Adresse. Erst die Uebersichtskarte braucht sie - fehlen sie, zeigt die
 * Seite die Liste und sagt, dass die Karte noch fehlt.
 */
const orte = defineCollection({
  loader: file("src/content/orte.json"),
  schema: z.object({
    name: z.string().min(1),
    adresse: z.string().optional(),
    plz: z.string().optional(),
    stadt: z.string().min(1),
    art: z.enum(["tagungsort", "exkursion", "uebernachtung", "rahmenprogramm"]),
    hinweis: z.string().optional(),
    koordinaten: z
      .object({
        breite: z.number().min(-90).max(90),
        laenge: z.number().min(-180).max(180),
      })
      .optional(),
  }),
});

const programm = defineCollection({
  loader: file("src/content/programm.json"),
  schema: z
    .object({
      /**
       * Stabile Kennung. Sie wird in "Mein Programm" gespeichert und in
       * Kalendereintraegen verwendet - sie darf sich bei inhaltlichen
       * Aenderungen NICHT aendern.
       */
      titel: z.string().min(1),
      beginn: ortszeit.optional(),
      ende: ortszeit.optional(),
      /** Wenn es keine feste Zeit gibt, z. B. "ab 19:00 Uhr". */
      zeitHinweis: z.string().optional(),
      /** Verweist auf einen Eintrag in orte.json. */
      ortId: z.string().optional(),
      /** Raum innerhalb des Ortes, z. B. "Raum 2". */
      raum: z.string().optional(),
      beschreibung: z.string().optional(),
      spur: spur.default("haupt"),
      status: bestaetigung.default("bestaetigt"),
      /** Teilnahme freigestellt (Spaziergang, Weinfest). */
      optional: z.boolean().default(false),
      /**
       * Offener Punkt aus der Vorlage, der in der Ansicht sichtbar gemacht wird.
       * Kein interner Vermerk - was hier steht, ist oeffentlich.
       */
      hinweis: z.string().optional(),
      /**
       * Personen bleiben vorerst leer: Das Repository ist oeffentlich, und die
       * Vorlage fuehrt Referierende teils mit Vermerken wie "angefragt".
       * Erst wenn das Orga-Team benennt, welche Namen freigegeben sind, wird
       * hier gepflegt. Siehe docs/offene-fragen.md.
       */
      personen: z
        .array(z.object({ name: z.string().min(1), rolle: z.string().optional() }))
        .default([]),
    })
    .refine((p) => p.beginn !== undefined || p.zeitHinweis !== undefined, {
      message: "Ein Punkt braucht entweder einen Beginn oder einen Zeithinweis",
    })
    .refine((p) => p.ende === undefined || p.beginn !== undefined, {
      message: "Ein Ende ohne Beginn ergibt keinen Zeitraum",
    })
    .refine((p) => p.ende === undefined || p.beginn === undefined || p.ende > p.beginn, {
      message: "Das Ende muss nach dem Beginn liegen",
    }),
});

/**
 * Exkursionen am Freitagnachmittag. Uebernommen aus dem Einzeldatei-Entwurf;
 * die eckigen Klammern in Treffpunkt und Anreise sind bewusst erhalten - sie
 * sind Platzhalter des Orga-Teams und werden in der Ansicht als solche
 * gekennzeichnet, statt still zu verschwinden.
 */
const exkursionen = defineCollection({
  loader: file("src/content/exkursionen.json"),
  schema: z.object({
    titel: z.string().min(1),
    /** Plaetze insgesamt. Die Vergabe braucht einen Server (ADR-0004). */
    plaetze: z.number().int().positive(),
    zeitrahmen: z.string().min(1),
    /** Verweist auf einen Eintrag in orte.json. */
    ortId: z.string().optional(),
    treffpunkt: z.string().optional(),
    anreise: z.string().optional(),
    verantwortlich: z.string().optional(),
    telefon: z.string().optional(),
    info: z.string().optional(),
  }),
});

/** Hotels mit eigenem Zimmerkontingent und Empfehlungen ohne Kontingent. */
const unterkuenfte = defineCollection({
  loader: file("src/content/unterkuenfte.json"),
  schema: z.object({
    name: z.string().min(1),
    /** Verweist auf einen Eintrag in orte.json. */
    ortId: z.string().optional(),
    /** true = eigenes Kontingent fuer die Tagung, false = blosse Empfehlung. */
    kontingent: z.boolean().default(false),
    zeitraum: z.string().optional(),
    stichwort: z.string().optional(),
    zimmer: z
      .array(z.object({ typ: z.string(), anzahl: z.number().int(), preis: z.string() }))
      .default([]),
    adresse: z.string().optional(),
    telefon: z.string().optional(),
    email: z.string().optional(),
    // z.url() statt z.string().url(): Letzteres ist in zod 4 abgekuendigt.
    web: z.url().optional(),
  }),
});

const ankuendigungen = defineCollection({
  loader: file("src/content/ankuendigungen.json"),
  schema: z.object({
    datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Erwartet wird JJJJ-MM-TT"),
    titel: z.string().min(1),
    text: z.string().min(1),
    /** "wichtig" hebt hervor; sparsam einsetzen, sonst nutzt es sich ab. */
    gewicht: z.enum(["wichtig", "info"]).default("info"),
  }),
});

/**
 * Ansprechpersonen des Orga-Teams.
 *
 * Anders als beim Programm sind Namen hier erwuenscht: Das ist der Zweck der
 * Seite. Telefon und E-Mail stehen als Platzhalter, bis das Orga-Team sie
 * freigibt - eine erfundene Adresse waere schlimmer als eine fehlende.
 */
const kontakte = defineCollection({
  loader: file("src/content/kontakte.json"),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1),
      /** Kleinere Zahl steht weiter oben. Bewusst gesetzt statt alphabetisch. */
      reihenfolge: z.number().int(),
      bereich: z.string().optional(),
      telefon: z.string().optional(),
      email: z.string().optional(),
      /** Portraits werden nachgereicht; bis dahin stehen Initialen. */
      bild: image().optional(),
      bildnachweis: z.string().optional(),
    }),
});

/**
 * Grussworte zur Eroeffnung.
 *
 * `bild` nutzt den image()-Helfer: Astro optimiert das Bild beim Bauen und
 * liefert passende Groessen aus - die Vorlage des Landesvorsitzenden hat 1 MB,
 * unveraendert ausgeliefert waere das auf einem Mobilfunknetz spuerbar.
 *
 * `bildnachweis` ist Pflicht, sobald ein Bild gesetzt ist: Portraits sind
 * urheberrechtlich geschuetzt, und ohne Nachweis laesst sich spaeter nicht mehr
 * feststellen, woher das Bild stammt und ob wir es zeigen duerfen (F16).
 */
const grussworte = defineCollection({
  loader: file("src/content/grussworte.json"),
  schema: ({ image }) =>
    z
      .object({
        name: z.string().min(1),
        rolle: z.string().min(1),
        bild: image().optional(),
        bildnachweis: z.string().optional(),
        /** Ein Eintrag je Absatz. */
        absaetze: z.array(z.string().min(1)).min(1),
        /** Kleinere Zahl steht weiter oben. */
        reihenfolge: z.number().int(),
        /** Solange der Originaltext fehlt, ist der Text ein Platzhalter. */
        status: bestaetigung.default("platzhalter"),
      })
      .refine((eintrag) => eintrag.bild === undefined || eintrag.bildnachweis !== undefined, {
        message: "Zu jedem Bild gehoert ein Bildnachweis",
      }),
});

const faq = defineCollection({
  loader: file("src/content/faq.json"),
  schema: z.object({
    frage: z.string().min(1),
    antwort: z.string().min(1),
    /**
     * Nummerierte Schritte fuer Fragen, die eine Anleitung sind. Fliesstext
     * taugt dafuer nicht: Am Geraet arbeitet man eine Anleitung ab und hebt
     * dabei den Blick - in einem Absatz verliert man die Stelle.
     */
    schritte: z.array(z.string().min(1)).min(2).optional(),
    /** Nachgestellte Einordnung, z. B. warum ein Schritt fehlschlagen kann. */
    hinweis: z.string().min(1).optional(),
  }),
});

/**
 * Die Texte zur Stadt. Markdown statt JSON, weil es hier um Fliesstext mit
 * Hervorhebungen und Verweisen geht - in JSON waere das eine Zeile voller
 * Sonderzeichen, die niemand freiwillig pflegt.
 *
 * Je Abschnitt eine Datei: So laesst sich einer ueberarbeiten, ohne die
 * anderen anzufassen, und der Diff im Pull Request bleibt lesbar.
 */
const stadt = defineCollection({
  loader: glob({ pattern: "*.md", base: "src/content/stadt" }),
  schema: z.object({
    titel: z.string().min(1),
    /** Name eines <symbol> ohne das Praefix "i-". */
    ikone: z.string().min(1),
    reihenfolge: z.number().int(),
  }),
});

/** Eckdaten zur Stadt, als Zahl und Erlaeuterung getrennt. */
const stadtzahlen = defineCollection({
  loader: file("src/content/stadtzahlen.json"),
  schema: z.object({
    wert: z.string().min(1),
    was: z.string().min(1),
  }),
});

const stadtlinks = defineCollection({
  loader: file("src/content/stadtlinks.json"),
  schema: z.object({
    titel: z.string().min(1),
    web: z.url(),
  }),
});

export const collections = {
  orte,
  programm,
  exkursionen,
  unterkuenfte,
  ankuendigungen,
  kontakte,
  faq,
  grussworte,
  stadt,
  stadtzahlen,
  stadtlinks,
};
