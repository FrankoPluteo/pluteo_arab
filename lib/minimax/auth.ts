const MINIMAX_TOKEN_URL = 'https://moj.minimax.hr/HR/AUT/oauth20/token';

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export async function getMinimaxToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - now > 60_000) {
    return cachedToken.accessToken;
  }

  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: process.env.MINIMAX_CLIENT_ID || '',
    client_secret: process.env.MINIMAX_CLIENT_SECRET || '',
    username: process.env.MINIMAX_API_USERNAME || '',
    password: process.env.MINIMAX_API_PASSWORD || '',
  });

  const response = await fetch(MINIMAX_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Minimax token request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return cachedToken.accessToken;
}
