import { getMinimaxToken } from './auth';

const MINIMAX_API_URL = 'https://moj.minimax.hr/HR/API';
const MINIMAX_ORGANISATION_ID = process.env.MINIMAX_ORGANISATION_ID || '';

// All Minimax resources (Customer, Item, IssuedInvoice, ...) live under
// /api/orgs/{organisationId}/... relative to the API root above.
export async function minimaxFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getMinimaxToken();

  return fetch(`${MINIMAX_API_URL}/api/orgs/${MINIMAX_ORGANISATION_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}
