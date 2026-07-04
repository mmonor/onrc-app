import { getCompanyByCui } from '../../lib/api';

export default async function CompanyPage({ params }) {
  const { cui } = await params;
  
  let company;
  try {
    company = await getCompanyByCui(cui);
  } catch (err) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-red-600">Compania nu a fost găsită.</p>
        <a href="/" className="text-sm text-blue-600 hover:underline">← Înapoi</a>
      </main>
    );
  }

  const fields = [
    { label: 'CUI', value: company.cui },
    { label: 'Denumire', value: company.denumire },
    { label: 'Cod înmatriculare', value: company.cod_inmatriculare },
    { label: 'Stare', value: company.stare },
    { label: 'Județ', value: company.judet },
    { label: 'Localitate', value: company.localitate },
    { label: 'Adresă', value: company.adresa },
    { label: 'Cod poștal', value: company.cod_postal },
    { label: 'Telefon', value: company.telefon },
    { label: 'Fax', value: company.fax },
    { label: 'Email', value: company.email },
    { label: 'Web', value: company.web },
    { label: 'Cod CAEN', value: company.cod_caen },
    { label: 'Activitate CAEN', value: company.caen_denumire },
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <a href="/" className="text-sm text-blue-600 hover:underline">← Înapoi la listă</a>

      <h1 className="text-2xl font-semibold mt-4 mb-6">{company.denumire}</h1>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex border-b border-gray-100 last:border-0">
            <span className="w-48 px-4 py-3 text-sm font-medium text-gray-500 bg-gray-50 shrink-0">
              {label}
            </span>
            <span className="px-4 py-3 text-sm text-gray-900">
              {value || '—'}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}