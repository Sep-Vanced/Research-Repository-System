'use client';

import { useMemo, useState } from 'react';

type CitationExportProps = {
  title: string;
  year: number;
  authors: string[];
  url: string;
};

function formatAuthors(authors: string[]) {
  if (!authors.length) return 'Unknown Author';
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
  return `${authors[0]} et al.`;
}

export default function CitationExport({ title, year, authors, url }: CitationExportProps) {
  const [message, setMessage] = useState<string | null>(null);
  const authorText = formatAuthors(authors);

  const citations = useMemo(() => {
    const apa = `${authorText}. (${year}). ${title}. Research and Development Repository. ${url}`;
    const mla = `${authorText}. "${title}." Research and Development Repository, ${year}, ${url}.`;
    const bib = `@misc{${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${year},
  title = {${title}},
  author = {${authors.join(' and ') || 'Unknown Author'}},
  year = {${year}},
  howpublished = {Research and Development Repository},
  url = {${url}}
}`;
    return { apa, mla, bib };
  }, [authorText, year, title, url, authors]);

  const copyCitation = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setMessage(`${label} citation copied.`);
    setTimeout(() => setMessage(null), 2000);
  };

  const downloadBibtex = () => {
    const blob = new Blob([citations.bib], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'citation.bib';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-800">Citation Export</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => copyCitation(citations.apa, 'APA')} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
          Copy APA
        </button>
        <button type="button" onClick={() => copyCitation(citations.mla, 'MLA')} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
          Copy MLA
        </button>
        <button type="button" onClick={() => copyCitation(citations.bib, 'BibTeX')} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
          Copy BibTeX
        </button>
        <button type="button" onClick={downloadBibtex} className="rounded-md border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700">
          Download .bib
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-emerald-600">{message}</p> : null}
    </div>
  );
}
