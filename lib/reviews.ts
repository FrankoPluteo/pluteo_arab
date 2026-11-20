/**
 * Master switch for everything the storefront shows from the Review table: stars and counts
 * on product cards, the rating block (and its review form) on the product page, the
 * AggregateRating in the product JSON-LD and the aggregates from GET /api/reviews.
 *
 * Off until the stored reviews can be traced to real customers (see SEO-AUDIT.md, K1).
 * The reviews themselves stay in the database; set this to true to bring it all back.
 */
// Typed as boolean, not the literal false, so the code behind it keeps type-checking.
export const SHOW_REVIEWS: boolean = false;
