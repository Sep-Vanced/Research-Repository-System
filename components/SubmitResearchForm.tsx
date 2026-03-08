'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitResearch, uploadResearchFile } from '@/actions/research';
import { ResearchCategory, TaxonomyKeyword } from '@/types/research';

interface SubmitResearchFormProps {
  categories: ResearchCategory[];
  taxonomyKeywords: TaxonomyKeyword[];
}

const DRAFT_KEY = 'submit_research_draft_v1';

export default function SubmitResearchForm({ categories, taxonomyKeywords }: SubmitResearchFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [publicationYear, setPublicationYear] = useState(new Date().getFullYear());
  const [authors, setAuthors] = useState<string[]>(['']);
  const [keywords, setKeywords] = useState<string[]>(['']);
  const [coauthorEmails, setCoauthorEmails] = useState<string[]>(['']);
  const [files, setFiles] = useState<File[]>([]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);
  const taxonomyKeywordValues = useMemo(() => taxonomyKeywords.map((item) => item.keyword), [taxonomyKeywords]);

  useEffect(() => {
    setHydrated(true);
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as {
        title?: string;
        abstract?: string;
        categoryId?: string;
        publicationYear?: number;
        authors?: string[];
        keywords?: string[];
        coauthorEmails?: string[];
      };
      setTitle(draft.title || '');
      setAbstract(draft.abstract || '');
      setCategoryId(draft.categoryId || '');
      if (draft.publicationYear) setPublicationYear(draft.publicationYear);
      setAuthors(draft.authors?.length ? draft.authors : ['']);
      setKeywords(draft.keywords?.length ? draft.keywords : ['']);
      setCoauthorEmails(draft.coauthorEmails?.length ? draft.coauthorEmails : ['']);
      setMessage('Draft restored from local autosave.');
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload = {
      title,
      abstract,
      categoryId,
      publicationYear,
      authors,
      keywords,
      coauthorEmails,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  }, [title, abstract, categoryId, publicationYear, authors, keywords, coauthorEmails, hydrated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('abstract', abstract);
      formData.append('category_id', categoryId);
      formData.append('publication_year', publicationYear.toString());
      authors.forEach((author) => formData.append('authors', author));
      keywords.forEach((keyword) => formData.append('keywords', keyword));
      coauthorEmails.forEach((email) => formData.append('coauthor_emails', email));

      const result = await submitResearch(formData);

      if (result.success && result.projectId) {
        // Upload files if any
        for (const file of files) {
          await uploadResearchFile(result.projectId, file);
        }
        
        router.push('/dashboard');
        router.refresh();
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit research';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addAuthor = () => {
    setAuthors([...authors, '']);
  };

  const removeAuthor = (index: number) => {
    setAuthors(authors.filter((_, i) => i !== index));
  };

  const updateAuthor = (index: number, value: string) => {
    const updated = [...authors];
    updated[index] = value;
    setAuthors(updated);
  };

  const addKeyword = () => {
    setKeywords([...keywords, '']);
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const updateKeyword = (index: number, value: string) => {
    const updated = [...keywords];
    updated[index] = value;
    setKeywords(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const addCoauthorEmail = () => {
    setCoauthorEmails([...coauthorEmails, '']);
  };

  const removeCoauthorEmail = (index: number) => {
    setCoauthorEmails(coauthorEmails.filter((_, i) => i !== index));
  };

  const updateCoauthorEmail = (index: number, value: string) => {
    const updated = [...coauthorEmails];
    updated[index] = value;
    setCoauthorEmails(updated);
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setTitle('');
    setAbstract('');
    setCategoryId('');
    setPublicationYear(currentYear);
    setAuthors(['']);
    setKeywords(['']);
    setCoauthorEmails(['']);
    setFiles([]);
    setMessage('Draft cleared.');
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold sm:text-2xl">Submit Research</h1>
          <button
            type="button"
            onClick={clearDraft}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Clear Draft
          </button>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {message ? (
          <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">{message}</div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter research title"
            />
          </div>

          {/* Abstract */}
          <div>
            <label htmlFor="abstract" className="block text-sm font-medium text-gray-700 mb-2">
              Abstract *
            </label>
            <textarea
              id="abstract"
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              required
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter research abstract"
            />
          </div>

          {/* Category and Year */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Publication Year *
              </label>
              <select
                id="year"
                value={publicationYear}
                onChange={(e) => setPublicationYear(parseInt(e.target.value))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Authors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authors
            </label>
            {authors.map((author, index) => (
              <div key={index} className="mb-2 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={author}
                  onChange={(e) => updateAuthor(index, e.target.value)}
                  placeholder={`Author ${index + 1} name`}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {authors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAuthor(index)}
                    className="rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50 sm:text-center"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addAuthor}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              + Add Author
            </button>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keywords
            </label>
            {keywords.map((keyword, index) => (
              <div key={index} className="mb-2 flex flex-col gap-2 sm:flex-row">
                <input
                  list="taxonomy-keywords"
                  type="text"
                  value={keyword}
                  onChange={(e) => updateKeyword(index, e.target.value)}
                  placeholder={`Keyword ${index + 1}`}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {keywords.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeKeyword(index)}
                    className="rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50 sm:text-center"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addKeyword}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              + Add Keyword
            </button>
            <datalist id="taxonomy-keywords">
              {taxonomyKeywordValues.map((kw) => (
                <option key={kw} value={kw} />
              ))}
            </datalist>
          </div>

          {/* Co-author Emails */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Co-author Invites (Email)
            </label>
            {coauthorEmails.map((email, index) => (
              <div key={index} className="mb-2 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => updateCoauthorEmail(index, e.target.value)}
                  placeholder={`coauthor${index + 1}@example.com`}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                {coauthorEmails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCoauthorEmail(index)}
                    className="rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50 sm:text-center"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addCoauthorEmail}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              + Add Co-author Email
            </button>
          </div>

          {/* Files */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Files (PDF, datasets)
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.zip,.csv,.xlsx"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700 disabled:opacity-50 sm:w-auto"
            >
              {loading ? 'Submitting...' : 'Submit Research'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

