/**
 * Kontrastberechnung nach WCAG 2.2.
 *
 * Bewusst ohne Abhaengigkeit: Der Kontrast ist in `docs/ui-ux-designregeln.md`
 * (Regel 18) ein Abnahmekriterium, und ein Abnahmekriterium sollte nicht an einem
 * fremden Paket haengen, dessen Rundungsverhalten wir nicht kennen.
 */

const HEX_MUSTER = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Wandelt `#abc` oder `#aabbcc` in die drei Kanaele 0..1 um. */
function kanaele(farbwert: string): [number, number, number] {
  if (!HEX_MUSTER.test(farbwert)) {
    throw new Error(
      `Ungueltiger Farbwert: ${JSON.stringify(farbwert)}. Erwartet wird #rgb oder #rrggbb.`,
    );
  }

  const roh = farbwert.slice(1);
  const voll = roh.length === 3 ? roh.replace(/./g, (z) => z + z) : roh;

  return [0, 2, 4].map((versatz) => parseInt(voll.slice(versatz, versatz + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
}

/**
 * Relative Leuchtdichte (0 = Schwarz, 1 = Weiss).
 *
 * Die Schwelle 0.04045 und der Exponent 2.4 stammen unveraendert aus der
 * WCAG-Definition. Wer sie anpasst, aendert die Bedeutung aller Kontrastwerte.
 */
export function relativeLeuchtdichte(farbwert: string): number {
  const [r, g, b] = kanaele(farbwert).map((kanal) =>
    kanal <= 0.04045 ? kanal / 12.92 : Math.pow((kanal + 0.055) / 1.055, 2.4),
  ) as [number, number, number];

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Kontrastverhaeltnis zweier Farben, immer >= 1. Die Reihenfolge der Argumente
 * spielt keine Rolle.
 */
export function kontrastVerhaeltnis(farbeA: string, farbeB: string): number {
  const a = relativeLeuchtdichte(farbeA);
  const b = relativeLeuchtdichte(farbeB);
  const heller = Math.max(a, b);
  const dunkler = Math.min(a, b);

  return (heller + 0.05) / (dunkler + 0.05);
}

/** Mindestkontraste nach WCAG 2.2 Stufe AA. */
export const AA = {
  /** Fliesstext und kleine Schrift. */
  text: 4.5,
  /** Ab 24 px, oder ab 18.66 px bei fettem Schnitt. */
  grosseSchrift: 3,
  /** Bedienelemente, Zustandsgrenzen, Fokusringe (WCAG 1.4.11). */
  bedienelement: 3,
} as const;
