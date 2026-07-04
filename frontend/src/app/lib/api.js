const API_URL = typeof window === 'undefined'
  ? (process.env.API_URL || 'http://localhost:3001')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

function buildQueryString(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  return query.toString();
}

export async function getCompanies({ page = 1, limit = 20, q, cui, judet, stare } = {}) {
  const queryString = buildQueryString({ page, limit, q, cui, judet, stare });
  const res = await fetch(`${API_URL}/companies?${queryString}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch companies: ${res.status}`);
  }

  return res.json();
}

export async function getCompanyByCui(cui) {
  const res = await fetch(`${API_URL}/companies/${cui}`, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`Failed to fetch company: ${res.status}`);
  }

  return res.json();
}