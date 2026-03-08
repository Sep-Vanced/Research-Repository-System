'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import { ResearchCategory } from '@/types/research';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface ResearchFilterProps {
  categories: ResearchCategory[];
  years: number[];
}

export default function ResearchFilter({ categories, years }: ResearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const createQueryString = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/research?${createQueryString('search', search || null)}`);
  };

  const handleFilterChange = (key: string, value: string | null) => {
    router.push(`/research?${createQueryString(key, value)}`);
  };

  const clearFilters = () => {
    setSearch('');
    router.push('/research');
  };

  const hasFilters = searchParams.toString() !== '';

  return (
    <Card className="border-blue-100/80 bg-white/85">
      <CardContent className="space-y-4 p-5">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, abstract, or keyword..."
            className="md:flex-1"
          />
          <Button type="submit" className="md:w-auto">
            Search
          </Button>
        </form>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
          <select
            value={searchParams.get('category') || ''}
            onChange={(e) => handleFilterChange('category', e.target.value || null)}
            className="h-10 w-full rounded-md border border-blue-200 bg-white/90 px-3 text-sm text-blue-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 lg:w-auto"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={searchParams.get('year') || ''}
            onChange={(e) => handleFilterChange('year', e.target.value || null)}
            className="h-10 w-full rounded-md border border-blue-200 bg-white/90 px-3 text-sm text-blue-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 lg:w-auto"
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={searchParams.get('keyword') || ''}
            onChange={(e) => handleFilterChange('keyword', e.target.value || null)}
            className="h-10 w-full rounded-md border border-blue-200 bg-white/90 px-3 text-sm text-blue-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 lg:w-auto"
          >
            <option value="">All Keywords</option>
            <option value="machine-learning">Machine Learning</option>
            <option value="artificial-intelligence">Artificial Intelligence</option>
            <option value="data-science">Data Science</option>
            <option value="blockchain">Blockchain</option>
            <option value="iot">IoT</option>
          </select>

          {hasFilters && (
            <Button type="button" variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
              Clear Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
