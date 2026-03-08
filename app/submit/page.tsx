import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getCategories, getTaxonomyKeywords } from '@/lib/queries';
import SubmitResearchForm from '@/components/SubmitResearchForm';

export const dynamic = 'force-dynamic';

export default async function SubmitPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'researcher' && user.role !== 'admin') {
    redirect('/dashboard');
  }

  const [categories, taxonomyKeywords] = await Promise.all([
    getCategories(),
    getTaxonomyKeywords(),
  ]);

  return <SubmitResearchForm categories={categories} taxonomyKeywords={taxonomyKeywords} />;
}

