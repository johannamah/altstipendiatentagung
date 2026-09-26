import { file } from "astro/loaders";
import { defineCollection, z } from "astro:content";

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
      ort: z.string().optional(),
      adresse: z.string().optional(),
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

export const collections = { programm };
