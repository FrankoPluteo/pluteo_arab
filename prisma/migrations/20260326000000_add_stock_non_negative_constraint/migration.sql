-- Bug 7 fix: add a CHECK constraint so stock can never go negative at the database level.
-- This acts as a last-resort safety net for any bug that would otherwise silently
-- produce invalid inventory counts.
ALTER TABLE "Product"
  ADD CONSTRAINT "product_stock_non_negative" CHECK (stock >= 0);
