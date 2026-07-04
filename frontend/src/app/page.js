import { Suspense } from 'react';
import Link from 'next/link';
import { getCompanies } from './lib/api';
import SearchBar from './components/SearchBar';
import Filters from './components/Filters';
import CompanyTable from './components/CompanyTable';

export default async function HomePage({ searchParams }) {
  const params = await searchParams;

  const page = parseInt(params.page) || 1;
  const { q, cui, judet, stare } = params;

  const { data: companies, meta } = await getCompanies({
    page,
    limit: 20,
    q,
    cui,
    judet,
    stare,
  });

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
  <h1 className="text-2xl font-semibold">Firme ONRC</h1>
  <div className="flex gap-4">
    <a href="/enrich" className="text-sm text-blue-600 hover:underline">Îmbogățire date →</a>
    <a href="/import" className="text-sm text-blue-600 hover:underline">Import date →</a>
  </div>
</div>
      <Suspense fallback={null}>
        <SearchBar />
      </Suspense>

      <Suspense fallback={null}>
        <Filters />
      </Suspense>

      <p className="text-sm text-gray-500 mb-4">
        {meta.total.toLocaleString('ro-RO')} rezultate găsite
      </p>

      <CompanyTable companies={companies} />

      <div className="flex justify-center gap-2 mt-6">
        {page > 1 && (
          <Link
            href={`/?${new URLSearchParams({ ...params, page: page - 1 }).toString()}`}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Anterior
          </Link>
        )}

        <span className="px-4 py-2 text-sm text-gray-500">
          Pagina {page} din {meta.pages || 1}
        </span>

        {page < meta.pages && (
          <Link
            href={`/?${new URLSearchParams({ ...params, page: page + 1 }).toString()}`}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Următor →
          </Link>
        )}
      </div>
    </main>
  );
}