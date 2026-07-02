'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [cui, setCui] = useState(searchParams.get('cui') || '');

  
  function handleSubmit(e) {
    e.preventDefault();

    const params = new URLSearchParams(searchParams.toString());

    if (query) params.set('q', query); else params.delete('q');
    if (cui) params.set('cui', cui); else params.delete('cui');

    
    params.set('page', '1');

    router.push(`/?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 mb-6">
      <input
        type="text"
        placeholder="Caută după denumire..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="text"
        placeholder="CUI"
        value={cui}
        onChange={(e) => setCui(e.target.value)}
        className="w-32 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Caută
      </button>
    </form>
  );
}