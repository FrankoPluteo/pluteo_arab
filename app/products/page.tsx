import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCatalog, searchSuggestions } from '@/lib/catalog';
import { searchProducts } from '@/lib/search';
import { absoluteUrl, brandPath, genderPath, listingPagePath, shopPath } from '@/lib/urls';
import ProductsContent from './ProductsContent';

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;

  // Canonical keeps what makes a listing its own page (brand, gender, page number) and drops
  // sorting and the other filters, which only reorder or narrow the same products.
  const page = Math.max(1, parseInt(params.page || '1') || 1);
  const canonical = absoluteUrl(listingPagePath({ brand: params.brand, gender: params.gender }, page));

  let title: string;
  let description: string;

  if (params.brand && !params.gender) {
    title = `${params.brand} parfemi - kupite online`;
    description = `Otkrijte kolekciju ${params.brand} parfema. Originalni arapski i orijentalni mirisi uz brzu dostavu diljem Hrvatske.`;
  } else if (params.gender === 'male' && !params.brand) {
    title = 'Muški arapski parfemi - kupite online';
    description = 'Istražite našu ponudu muških arapskih parfema. Originalni orijentalni mirisi uz brzu dostavu diljem Hrvatske.';
  } else if (params.gender === 'female' && !params.brand) {
    title = 'Ženski arapski parfemi - kupite online';
    description = 'Istražite našu ponudu ženskih arapskih parfema. Originalni orijentalni mirisi uz brzu dostavu diljem Hrvatske.';
  } else if (params.search) {
    title = `Rezultati pretrage: "${params.search}"`;
    description = `Rezultati pretrage arapskih parfema za "${params.search}". Pronađite savršeni miris uz brzu dostavu diljem Hrvatske.`;
  } else {
    title = 'Arapski parfemi - kupite online';
    description = 'Pregledajte našu kolekciju autentičnih arapskih parfema, oud mirisa i luksuznih orijentalnih mirisa. Lattafa, Armaf i French Avenue - brza dostava diljem Hrvatske.';
  }

  // Later pages get their own title so they don't read as duplicates of page 1.
  if (page > 1) title = `${title} - stranica ${page}`;

  return {
    title,
    description,
    alternates: { canonical },
    // Search result pages are thin/duplicate content — keep them out of the index
    ...(params.search && { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      url: canonical,
    },
  };
}

const ITEMS_PER_PAGE = 12;

/**
 * Sorts in place. The default ('brand-order', shown as "Recommended") keeps the catalog's
 * own order, which is the one set in /admin/products/order (lib/productOrder.ts).
 */
function sortProducts<T extends { name: string; price: number; createdAt: Date }>(
  products: T[],
  sortBy: string | undefined
) {
  const [field, direction] = (sortBy && sortBy !== 'brand-order' ? sortBy : '').split('-');
  const sign = direction === 'desc' ? -1 : 1;
  if (field === 'price') {
    products.sort((a, b) => sign * (a.price - b.price));
  } else if (field === 'name') {
    products.sort((a, b) => sign * a.name.localeCompare(b.name, 'hr'));
  } else if (field === 'createdAt') {
    products.sort((a, b) => sign * (a.createdAt.getTime() - b.createdAt.getTime()));
  }
}

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    gender?: string;
    brand?: string;
    concentration?: string;
    fragranceProfile?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sortBy?: string;
    search?: string;
    onSale?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const currentPage = Math.max(1, parseInt(params.page || '1') || 1);
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const minPrice = params.minPrice ? parseFloat(params.minPrice) : null;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : null;

  try {
    // One cached read of the whole catalog (lib/catalog.ts); filters run in memory.
    const { products: catalog, brandNames } = await getCatalog();

    const allProfiles = new Set<string>();
    const allConcentrations = new Set<string>();
    catalog.forEach((p) => {
      allConcentrations.add(p.concentration);
      p.fragranceProfiles?.forEach((profile) => allProfiles.add(profile));
    });

    const filterOptions = {
      brands: brandNames,
      concentrations: Array.from(allConcentrations).sort(),
      fragranceProfiles: Array.from(allProfiles).sort(),
    };

    // A search forgives typos, accents and brand misspellings (lib/search.ts) and comes
    // back best match first.
    const search = params.search?.trim();
    const pool = search ? searchProducts(catalog, search) : catalog;
    const filtered = pool.filter((p) => {
      if (params.gender && p.gender !== params.gender && p.gender !== 'unisex') return false;
      if (params.brand && p.brand.name !== params.brand) return false;
      if (params.concentration && p.concentration !== params.concentration) return false;
      if (params.fragranceProfile && !p.fragranceProfiles.includes(params.fragranceProfile)) return false;
      if (params.inStock === 'true' && p.stock <= 0) return false;
      if (params.onSale === 'true' && p.discountAmount <= 0) return false;
      // Price filters use the price after the product's own discount
      const discounted = p.price - p.discountAmount;
      if (minPrice !== null && discounted < minPrice) return false;
      if (maxPrice !== null && discounted > maxPrice) return false;
      return true;
    });

    // Search results keep their relevance order unless a sort was picked
    if (!search || (params.sortBy && params.sortBy !== 'brand-order')) {
      sortProducts(filtered, params.sortBy);
    }

    const totalProducts = filtered.length;
    const products = filtered.slice(skip, skip + ITEMS_PER_PAGE);
    // Nothing found: show bestsellers rather than an empty page
    const suggestions = search && totalProducts === 0 ? searchSuggestions(catalog, 4) : [];

    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

    const breadcrumbItems: { name: string; item: string }[] = [
      { name: 'Početna', item: absoluteUrl('/') },
      { name: 'Parfemi', item: absoluteUrl(shopPath()) },
    ];
    if (params.brand) {
      breadcrumbItems.push({ name: params.brand, item: absoluteUrl(brandPath(params.brand)) });
    } else if (params.gender === 'male') {
      breadcrumbItems.push({ name: 'Muški parfemi', item: absoluteUrl(genderPath('male')) });
    } else if (params.gender === 'female') {
      breadcrumbItems.push({ name: 'Ženski parfemi', item: absoluteUrl(genderPath('female')) });
    }

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.item,
      })),
    };

    return (
      <div>
        <Navbar />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <ProductsContent
          products={products}
          totalProducts={totalProducts}
          currentPage={currentPage}
          totalPages={totalPages}
          skip={skip}
          filterOptions={filterOptions}
          searchParams={params}
          search={params.search}
          suggestions={suggestions}
        />
        <Footer />
      </div>
    );
  } catch (error) {
    console.error('Error loading products:', error);
    return (
      <div>
        <Navbar />
        <div style={{ padding: '120px 40px' }}>
          <p>Error loading products. Please try again later.</p>
        </div>
      </div>
    );
  }
}
