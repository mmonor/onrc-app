
'use client';
import { useRouter, useSearchParams } from 'next/navigation';


const JUDETE = [
  'ALBA', 'ARAD', 'ARGES', 'BACAU', 'BIHOR', 'BISTRITA-NASAUD',
  'BOTOSANI', 'BRAILA', 'BRASOV', 'BUZAU', 'CALARASI', 'CARAS-SEVERIN',
  'CLUJ', 'CONSTANTA', 'COVASNA', 'DAMBOVITA', 'DOLJ', 'GALATI',
  'GIURGIU', 'GORJ', 'HARGHITA', 'HUNEDOARA', 'IALOMITA', 'IASI',
  'ILFOV', 'MARAMURES', 'MEHEDINTI', 'MURES', 'NEAMT', 'OLT',
  'PRAHOVA', 'SALAJ', 'SATU MARE', 'SIBIU', 'SUCEAVA', 'TELEORMAN',
  'TIMIS', 'TULCEA', 'VALCEA', 'VASLUI', 'VRANCEA', 'BUCURESTI',
];

const STARI = ['ACTIVA', 'RADIATA', 'SUSPENDATA', 'DIZOLVATA'];

export default function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  
  function updateFilter(key, value) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) params.set(key, value); else params.delete(key);
    params.set('page', '1');

    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <select
        value={searchParams.get('judet') || ''}
        onChange={(e) => updateFilter('judet', e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Toate județele</option>
        {JUDETE.map((j) => (
          <option key={j} value={j}>{j}</option>
        ))}
      </select>

      <select
        value={searchParams.get('stare') || ''}
        onChange={(e) => updateFilter('stare', e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Toate stările</option>
        {STARI.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
