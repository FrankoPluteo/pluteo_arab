import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCatalog } from '@/lib/catalog';
import ProductsContent from './ProductsContent';

const BASE_URL = 'https://www.pluteo.shop';

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;

  // Canonical strips sort/pagination — only brand and gender are "category" params
  const canonicalParams = new URLSearchParams();
  if (params.brand) canonicalParams.set('brand', params.brand);
  if (params.gender) canonicalParams.set('gender', params.gender);
  const canonicalSuffix = canonicalParams.toString() ? `?${canonicalParams.toString()}` : '';
  const canonical = `${BASE_URL}/products${canonicalSuffix}`;

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

  return {
    title,
    description,
    keywords: 'arapski parfemi, arabski parfemi, premium arapski parfemi, oud parfemi, Lattafa parfemi, Armaf parfemi, French Avenue parfemi, luksuzni orijentalni mirisi, dugotrajni parfemi hrvatska, niche parfemi online',
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
const BRAND_ORDER = ['Lattafa', 'French Avenue', 'Armaf'];

/** Sorts in place. Default: brands in BRAND_ORDER, oldest products first within a brand. */
function sortProducts<T extends { name: string; price: number; createdAt: Date; brand: { name: string } }>(
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
  } else {
    const rank = (brand: string) => {
      const index = BRAND_ORDER.indexOf(brand);
      return index === -1 ? BRAND_ORDER.length : index;
    };
    products.sort((a, b) => rank(a.brand.name) - rank(b.brand.name));
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

    const search = params.search?.trim().toLowerCase();
    const filtered = catalog.filter((p) => {
      if (search) {
        const matches =
          p.name.toLowerCase().includes(search) ||
          (p.description ?? '').toLowerCase().includes(search) ||
          p.brand.name.toLowerCase().includes(search);
        if (!matches) return false;
      }
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

    sortProducts(filtered, params.sortBy);

    const totalProducts = filtered.length;
    const products = filtered.slice(skip, skip + ITEMS_PER_PAGE);

    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

    const breadcrumbItems: { name: string; item: string }[] = [
      { name: 'Početna', item: BASE_URL },
      { name: 'Parfemi', item: `${BASE_URL}/products` },
    ];
    if (params.brand) {
      breadcrumbItems.push({ name: params.brand, item: `${BASE_URL}/products?brand=${encodeURIComponent(params.brand)}` });
    } else if (params.gender === 'male') {
      breadcrumbItems.push({ name: 'Muški parfemi', item: `${BASE_URL}/products?gender=male` });
    } else if (params.gender === 'female') {
      breadcrumbItems.push({ name: 'Ženski parfemi', item: `${BASE_URL}/products?gender=female` });
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
