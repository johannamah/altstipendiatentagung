/**
 * Zeitachse: Wo liegt ein Programmpunkt, und was laeuft neben ihm?
 *
 * Reine Rechnung ueber Zeitintervalle, ohne DOM-Bezug. Das Zeichnen uebernimmt
 * CSS Grid - die Frage "welcher Punkt in welchen Strang" ist aber eine
 * Entscheidung mit Randfaellen und gehoert deshalb hierher, wo sie pruefbar ist.
 */

import type { Programmpunkt } from "./programm.ts";

/** Dauer, die ein Punkt ohne Endzeit auf der Achse bekommt. */
const MINDESTDAUER_MINUTEN = 60;

/**
 * Minuten seit Mitternacht des Bezugstags.
 *
 * Geht ein Punkt ueber Mitternacht, zaehlt es weiter: Der Festabend endet am
 * Sonntag um 03:00 Uhr, auf der Achse des Samstags ist das Minute 1620. Ohne
 * das liefe der Balken rueckwaerts.
 */
export function minutenImTag(zeitpunkt: string, bezugstag: string): number {
  const [stunde, minute] = zeitpunkt.slice(11, 16).split(":").map(Number) as [number, number];
  const tage = Math.round(
    (Date.parse(`${zeitpunkt.slice(0, 10)}T00:00:00Z`) - Date.parse(`${bezugstag}T00:00:00Z`)) /
      86_400_000,
  );

  return tage * 24 * 60 + stunde * 60 + minute;
}

/** Beginn und Ende eines Punktes in Minuten, mit Mindestdauer fuer offene Enden. */
function spanne(punkt: Programmpunkt, bezugstag: string): { von: number; bis: number } {
  const von = minutenImTag(punkt.beginn!, bezugstag);
  const bis = punkt.ende ? minutenImTag(punkt.ende, bezugstag) : von + MINDESTDAUER_MINUTEN;

  return { von, bis };
}

/**
 * Das Zeitfenster, das ein Tag auf der Achse einnimmt - auf volle Stunden
 * gerundet, damit die Stundenmarken aufgehen.
 */
export function tagesFenster(
  punkte: readonly Programmpunkt[],
  bezugstag: string,
): { von: number; bis: number } {
  const mitZeit = punkte.filter((p) => p.beginn !== undefined);

  if (mitZeit.length === 0) return { von: 0, bis: 0 };

  const spannen = mitZeit.map((p) => spanne(p, bezugstag));
  const von = Math.min(...spannen.map((s) => s.von));
  const bis = Math.max(...spannen.map((s) => s.bis));

  return { von: Math.floor(von / 60) * 60, bis: Math.ceil(bis / 60) * 60 };
}

export interface Straenge {
  /** Anzahl benoetigter Straenge - das ist die Breite der Achse. */
  straenge: number;
  /** Kennung des Punktes -> Strangnummer, von 0 an. */
  zuordnung: Map<string, number>;
}

/**
 * Verteilt die Punkte eines Tages auf moeglichst wenige Straenge, sodass sich
 * innerhalb eines Strangs nichts ueberschneidet.
 *
 * Gieriges Verfahren nach Beginnzeit: Jeder Punkt kommt in den ersten Strang,
 * der zu seiner Beginnzeit frei ist. Fuer Zeitintervalle liefert das
 * nachweislich die kleinstmoegliche Anzahl Straenge - und das zaehlt, weil
 * jeder zusaetzliche Strang die Achse auf dem Smartphone schmaler macht.
 *
 * Beruehrung an den Grenzen ist keine Ueberschneidung: Ein Punkt, der um 11:00
 * endet, und einer, der um 11:00 beginnt, teilen sich einen Strang.
 */
export function ordneStraengeZu(punkte: readonly Programmpunkt[], bezugstag: string): Straenge {
  const zuordnung = new Map<string, number>();

  const sortiert = punkte
    .filter((p) => p.beginn !== undefined)
    .map((p) => ({ punkt: p, ...spanne(p, bezugstag) }))
    // Bei gleichem Beginn nach Kennung, damit die Zuordnung reproduzierbar ist.
    .sort((a, b) => a.von - b.von || a.punkt.id.localeCompare(b.punkt.id));

  /** Bis wann der jeweilige Strang belegt ist. */
  const belegtBis: number[] = [];

  for (const { punkt, von, bis } of sortiert) {
    let strang = belegtBis.findIndex((ende) => ende <= von);

    if (strang === -1) {
      strang = belegtBis.length;
      belegtBis.push(bis);
    } else {
      belegtBis[strang] = bis;
    }

    zuordnung.set(punkt.id, strang);
  }

  return { straenge: belegtBis.length, zuordnung };
}

export interface AchsenPunkt {
  punkt: Programmpunkt;
  /** Rasterzeile, von 1 an - passt direkt auf grid-row. */
  zeileVon: number;
  zeileBis: number;
  /** Rasterspalte, von 1 an - passt direkt auf grid-column. */
  spalte: number;
}

/** Aufloesung des Rasters. 15 Minuten reichen fuer alle Zeiten im Programm. */
export const RASTER_MINUTEN = 15;

/** Bereitet einen Tag fuer die Darstellung als CSS-Grid auf. */
export function alsAchse(
  punkte: readonly Programmpunkt[],
  bezugstag: string,
): { fenster: { von: number; bis: number }; straenge: number; eintraege: AchsenPunkt[] } {
  const fenster = tagesFenster(punkte, bezugstag);
  const { straenge, zuordnung } = ordneStraengeZu(punkte, bezugstag);

  const eintraege = punkte
    .filter((p) => p.beginn !== undefined)
    .map((punkt) => {
      const { von, bis } = spanne(punkt, bezugstag);

      return {
        punkt,
        zeileVon: Math.floor((von - fenster.von) / RASTER_MINUTEN) + 1,
        // Mindestens eine Rasterzeile hoch, damit nichts auf null Hoehe faellt.
        zeileBis: Math.max(
          Math.ceil((bis - fenster.von) / RASTER_MINUTEN) + 1,
          Math.floor((von - fenster.von) / RASTER_MINUTEN) + 2,
        ),
        spalte: (zuordnung.get(punkt.id) ?? 0) + 1,
      };
    });

  return { fenster, straenge, eintraege };
}

/** Die vollen Stunden im Fenster - fuer die Beschriftung der Achse. */
export function stundenMarken(fenster: { von: number; bis: number }): {
  beschriftung: string;
  zeile: number;
}[] {
  const marken: { beschriftung: string; zeile: number }[] = [];

  for (let minute = fenster.von; minute <= fenster.bis; minute += 60) {
    const stunde = Math.floor(minute / 60) % 24;

    marken.push({
      beschriftung: `${String(stunde).padStart(2, "0")}:00`,
      zeile: (minute - fenster.von) / RASTER_MINUTEN + 1,
    });
  }

  return marken;
}
