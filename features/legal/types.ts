/** A paragraph, or a bulleted list of short items. */
export type LegalBlock = string | { list: string[] };

export type LegalSection = { id: string; title: string; body: LegalBlock[] };

/**
 * A legal page's long-form text. Kept in code rather than in messages/*.json: it is prose that changes as a
 * whole, with its date, and every claim in it has to match what the code does.
 */
export type LegalDoc = { title: string; updated: string; intro: string[]; sections: LegalSection[] };
