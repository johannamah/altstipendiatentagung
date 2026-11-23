/** Umgebungsvariablen, die Astro beim Bauen in die Seiten schreibt (ADR-0014). */
interface ImportMetaEnv {
  /** Projektadresse bei Supabase. Fehlt sie, zeigt die Seite "nicht verbunden". */
  readonly PUBLIC_SUPABASE_URL?: string;
  /** Veroeffentlichbarer Schluessel - steht ohnehin in jedem Browser. Nie den geheimen. */
  readonly PUBLIC_SUPABASE_KEY?: string;
}
