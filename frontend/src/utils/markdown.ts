import { Marked } from 'marked';

export interface Heading {
  depth: 2 | 3;
  text: string;
  id: string;
}

/** Ubah teks heading jadi anchor yang aman untuk URL. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_~]/g, '')           // buang penanda markdown inline
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // sisakan huruf, angka, spasi, hyphen
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Render Markdown jadi HTML sekaligus mengembalikan daftar headingnya.
 *
 * Keduanya dihasilkan dalam satu jalan supaya `id` di HTML dan `id` di daftar
 * isi dijamin sama — termasuk saat ada dua heading berjudul identik, yang
 * penomoran duplikatnya harus persis sinkron.
 *
 * Instance Marked dibuat lokal, bukan `marked.use()` global, agar konfigurasi
 * ini tidak bocor ke pemakaian marked di tempat lain.
 */
export function renderArticle(markdown: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const used = new Map<string, number>();

  const uniqueId = (text: string): string => {
    const base = slugify(text) || 'bagian';
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen + 1}`;
  };

  const md = new Marked({
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        const raw = tokens.map((t) => ('text' in t ? String(t.text) : '')).join('');
        const id = uniqueId(raw);

        if (depth === 2 || depth === 3) {
          headings.push({ depth, text: raw, id });
        }
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },
    },
  });

  const html = md.parse(markdown, { async: false }) as string;
  return { html, headings };
}
