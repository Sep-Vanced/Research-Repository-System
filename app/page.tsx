import Link from 'next/link';
import Image from 'next/image';
import { getResearchProjects, getCategories } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_RESEARCH_LIST } from '@/lib/mock-data';
import { ResearchCategory, ResearchProject } from '@/types/research';
import heroBackground from '@/app/public/image/1bg.jpg';
import prmsuLogo from '@/app/public/image/prmsu_logo.png';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let research: ResearchProject[] = [];
  let categories: ResearchCategory[] = [];

  try {
    [research, categories] = await Promise.all([
      getResearchProjects({}, 6, 0),
      getCategories(),
    ]);
  } catch (error) {
    console.error('Home page data fallback:', error);
  }

  const displayResearch = research.length > 0 ? research : MOCK_RESEARCH_LIST.slice(0, 5);
  const displayCategories =
    categories.length > 0
      ? categories
      : Array.from(
          new Map(
            MOCK_RESEARCH_LIST.map((item) => [item.category?.id, item.category]).filter(
              (entry): entry is [string, NonNullable<(typeof MOCK_RESEARCH_LIST)[number]['category']>] =>
                Boolean(entry[0] && entry[1])
            )
          ).values()
        );

  return (
    <div className="pb-14">
      <section className="section-wrap pt-8 sm:pt-12 md:pt-20">
        <Card className="overflow-hidden border-blue-200/90 text-white shadow-2xl">
          <CardContent className="relative p-5 sm:p-8 md:p-12">
            <Image
              src={heroBackground}
              alt="Research background"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#071946]/90 via-[#0d2a75]/80 to-[#1e40af]/65" />
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-primary-300/20 blur-3xl" />
            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
              <div className="space-y-4 sm:space-y-6">
                <p className="text-xs uppercase tracking-[0.3em] text-blue-100 sm:text-sm">Research Repository System</p>
                <h1 className="max-w-4xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
                  A modern hub for academic publishing, collaboration, and discovery.
                </h1>
                <p className="max-w-3xl text-base text-blue-100/90 sm:text-lg md:text-xl">
                  Built for universities and institutions to streamline research submission, review,
                  and public access.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                    <Link href="/research">Browse Research</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="w-full border-blue-300 text-white hover:bg-white/20 sm:w-auto">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              </div>

              <div className="justify-self-start rounded-2xl border border-white/30 bg-gradient-to-b from-white/20 to-white/5 p-4 backdrop-blur-md sm:p-5 lg:justify-self-end">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white/90 p-1.5 shadow-lg">
                    <Image
                      src={prmsuLogo}
                      alt="PRMSU logo"
                      className="h-12 w-12 object-contain"
                      priority
                    />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white sm:text-lg">
                      <span className="block">My PRMSU,</span>
                      <span className="block">My University</span>
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-px w-full bg-gradient-to-r from-white/40 via-white/15 to-transparent" />
                <p className="mt-3 text-xs leading-relaxed tracking-wide text-blue-100/90">
                  Building a stronger research culture through accessible publication and collaboration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="section-wrap mt-8 sm:mt-12 md:mt-14">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Research Papers', value: `${displayResearch.length}+` },
            { label: 'Categories', value: `${displayCategories.length}+` },
            { label: 'Active Roles', value: '3' },
            { label: 'Dynamic Routes', value: '8' },
          ].map((item) => (
            <Card key={item.label} className="border-blue-100/80 bg-white/75">
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold text-blue-700 md:text-4xl">{item.value}</p>
                <p className="mt-1 text-sm text-blue-900/75">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-wrap mt-8 sm:mt-12 md:mt-14">
        <Card className="glass-surface">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Research Categories</CardTitle>
              <CardDescription>Explore by field and specialization.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {displayCategories.map((category) => (
                <Button
                  key={category.id}
                  asChild
                  variant="outline"
                  className="h-auto justify-start rounded-lg border-blue-200 bg-white/85 px-4 py-3 text-left text-blue-900 hover:bg-blue-50"
                >
                  <Link href={`/research?category=${category.id}`}>{category.name}</Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="section-wrap mt-8 sm:mt-12 md:mt-14">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-2xl font-semibold text-blue-950 sm:text-3xl">Recent Research</h2>
          <Button asChild variant="ghost" className="text-base">
            <Link href="/research">View All</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayResearch.map((item) => (
            <Card
              key={item.id}
              className="group border-blue-100/90 bg-white/85 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <CardHeader className="space-y-2 pb-3">
                <p className="text-xs uppercase tracking-wider text-blue-700">{item.category?.name}</p>
                <CardTitle className="line-clamp-2 text-xl leading-snug">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-3 text-sm text-blue-900/80">{item.abstract}</p>
                <div className="flex items-center justify-between text-xs text-blue-900/70">
                  <span>{item.publication_year}</span>
                  <span className="line-clamp-1 max-w-[60%] text-right">
                    {item.authors?.map((a) => a.author_name).join(', ')}
                  </span>
                </div>
                <Button asChild className="w-full">
                  <Link href={`/research/${item.id}`}>Open Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
