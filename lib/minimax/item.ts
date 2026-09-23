import { minimaxFetch } from './client';

// Products are not created on the fly here — they must already exist in the
// Minimax item catalog (imported ahead of time, matched by SKU) before an order
// containing them can be invoiced.
export async function getMinimaxItemId(minimaxSku: string): Promise<number> {
  const response = await minimaxFetch(`/items/code(${minimaxSku})`);

  if (response.status === 404) {
    throw new Error(
      `Minimax item not found for SKU "${minimaxSku}". Import this product into the Minimax item catalog before it can be invoiced.`
    );
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Minimax item lookup failed for SKU "${minimaxSku}" (${response.status}): ${text}`);
  }

  const item = await response.json();
  return item.ItemId;
}
