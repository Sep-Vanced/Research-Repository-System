'use client';

import { useState, useTransition } from 'react';
import { ResearchCategory, TaxonomyKeyword } from '@/types/research';
import {
  addTaxonomyKeywordAction,
  createCategoryAction,
  deleteCategoryAction,
  deleteTaxonomyKeywordAction,
} from '@/actions/taxonomy';

type TaxonomyManagerProps = {
  categories: ResearchCategory[];
  keywords: TaxonomyKeyword[];
};

export default function TaxonomyManager({ categories, keywords }: TaxonomyManagerProps) {
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-100 bg-white/90 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-700">Manage Categories</p>
        <div className="mb-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Category name"
            suppressHydrationWarning
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={newCategoryDesc}
            onChange={(e) => setNewCategoryDesc(e.target.value)}
            placeholder="Description (optional)"
            suppressHydrationWarning
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={isPending}
            suppressHydrationWarning
            onClick={() =>
              startTransition(async () => {
                await createCategoryAction(newCategory, newCategoryDesc);
                setNewCategory('');
                setNewCategoryDesc('');
              })
            }
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Add
          </button>
        </div>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-slate-800">{category.name}</p>
                <p className="text-xs text-slate-500">{category.description || 'No description'}</p>
              </div>
              <button
                type="button"
                disabled={isPending}
                suppressHydrationWarning
                onClick={() =>
                  startTransition(async () => {
                    await deleteCategoryAction(category.id);
                  })
                }
                className="text-xs font-semibold text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-blue-100 bg-white/90 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-700">Manage Taxonomy Keywords</p>
        <div className="mb-3 grid gap-2 md:grid-cols-[1fr_auto]">
          <input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Add keyword"
            suppressHydrationWarning
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={isPending}
            suppressHydrationWarning
            onClick={() =>
              startTransition(async () => {
                await addTaxonomyKeywordAction(newKeyword);
                setNewKeyword('');
              })
            }
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <button
              key={keyword.id}
              type="button"
              disabled={isPending}
              suppressHydrationWarning
              onClick={() =>
                startTransition(async () => {
                  await deleteTaxonomyKeywordAction(keyword.id);
                })
              }
              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-red-100 hover:text-red-700"
              title="Delete keyword"
            >
              {keyword.keyword}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
