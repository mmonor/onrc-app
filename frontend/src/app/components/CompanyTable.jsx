import Link from 'next/link';

export default function CompanyTable({ companies }) {
  if (companies.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        Niciun rezultat găsit.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">CUI</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Denumire</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Județ</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Stare</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">CAEN</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {companies.map((company) => (
            <tr key={company.id} className="hover:bg-gray-50 cursor-pointer">
              <td className="px-4 py-3 text-sm font-mono">
                <Link href={`/company/${company.cui}`} className="hover:text-blue-600">
                  {company.cui}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm">
                <Link href={`/company/${company.cui}`} className="hover:text-blue-600">
                  {company.denumire}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm">{company.judet || '—'}</td>
              <td className="px-4 py-3 text-sm">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  company.stare === 'FUNCȚIUNE'
                    ? 'bg-green-100 text-green-700'
                    : company.stare
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-gray-50 text-gray-400'
                }`}>
                  {company.stare || '—'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">{company.caen_denumire || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}