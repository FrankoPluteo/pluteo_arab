import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAX_PRODUCTS = 30;

interface QuizBody {
  mode?: 'quiz';
  occasion: string;
  intensity: string;
  scents: string[];
  gender: 'male' | 'female';
  budget: 'under30' | '30-50' | 'over50';
  language?: 'hr' | 'en';
}

interface FreeformBody {
  mode: 'freeform';
  description: string;
  gender: 'male' | 'female';
  language?: 'hr' | 'en';
}

interface Recommendation {
  productId: number;
  reason: string;
}

type ProductRow = {
  id: string;
  name: string;
  price: number;
  discountAmount: number;
  concentration: string;
  size: number;
  images: string[];
  fragranceProfiles: string[];
  topNotes: string[];
  baseNotes: string[];
  brand: { name: string };
};

function buildProductList(products: ProductRow[]): string {
  return products
    .map((p, i) => {
      const price = Math.round((p.price - p.discountAmount) * 100) / 100;
      const profiles = p.fragranceProfiles.join('/');
      const notes = [...p.topNotes, ...p.baseNotes].join(',');
      return `${i + 1}.${p.brand.name} ${p.name}|€${price}|${profiles}|${notes}`;
    })
    .join('\n');
}

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  products: ProductRow[]
): Promise<NextResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!claudeRes.ok) {
    const errText = await claudeRes.text();
    console.error('Anthropic API error:', errText);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 502 });
  }

  const claudeData = await claudeRes.json();
  const rawContent: string = claudeData.content?.[0]?.text ?? '';

  if (!rawContent) {
    return NextResponse.json({ error: 'Empty AI response' }, { status: 502 });
  }

  let recommendations: Recommendation[];
  try {
    recommendations = JSON.parse(rawContent);
  } catch {
    const match = rawContent.match(/\[[\s\S]*\]/);
    if (!match) {
      console.error('Could not parse AI response:', rawContent);
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502 });
    }
    recommendations = JSON.parse(match[0]);
  }

  const results = recommendations
    .map((rec) => {
      const product = products[rec.productId - 1];
      if (!product) return null;
      return {
        product: {
          id: product.id,
          name: product.name,
          brand: { name: product.brand.name },
          price: product.price,
          discountAmount: product.discountAmount,
          images: product.images,
          concentration: product.concentration,
          size: product.size,
        },
        reason: rec.reason,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ results });
}

export async function POST(request: Request) {
  try {
    const body: QuizBody | FreeformBody = await request.json();
    const { language = 'hr' } = body;
    const mode = (body as FreeformBody).mode === 'freeform' ? 'freeform' : 'quiz';

    if (mode === 'freeform') {
      const { description, gender } = body as FreeformBody;

      if (!description?.trim() || !gender) {
        return NextResponse.json({ error: 'Missing description or gender' }, { status: 400 });
      }

      const safeDesc = description.slice(0, 300).trim();

      const products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          price: true,
          discountAmount: true,
          concentration: true,
          size: true,
          images: true,
          fragranceProfiles: true,
          topNotes: true,
          baseNotes: true,
          brand: { select: { name: true } },
        },
        where: {
          stock: { gt: 0 },
          gender: { in: [gender, 'unisex', 'Unisex'] },
        },
        orderBy: { createdAt: 'desc' },
        take: MAX_PRODUCTS,
      });

      if (products.length === 0) {
        return NextResponse.json({ results: [] });
      }

      const productList = buildProductList(products);

      const systemPrompt =
        language === 'hr'
          ? 'Parfumer si. Preporuči 2-3 parfema iz liste koji odgovaraju opisu. Odgovori SAMO JSON-om: [{"productId":br,"reason":"2 rečenice na hr"}]. Bez teksta van JSON-a.'
          : 'You are a perfumer. Recommend 2-3 perfumes from the list matching the description. Respond ONLY as JSON: [{"productId":number,"reason":"2 sentences"}]. No text outside JSON.';

      const userMessage =
        language === 'hr'
          ? `Opis: "${safeDesc}"\n\nParfemi (br.brand naziv|cijena|profili|note):\n${productList}`
          : `Description: "${safeDesc}"\n\nPerfumes (no.brand name|price|profiles|notes):\n${productList}`;

      return callClaude(systemPrompt, userMessage, products);
    }

    // Quiz mode
    const { occasion, intensity, scents, gender, budget } = body as QuizBody;

    if (!occasion || !intensity || !scents?.length || !gender || !budget) {
      return NextResponse.json({ error: 'Missing quiz answers' }, { status: 400 });
    }

    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        discountAmount: true,
        concentration: true,
        size: true,
        images: true,
        fragranceProfiles: true,
        topNotes: true,
        baseNotes: true,
        brand: { select: { name: true } },
      },
      where: {
        stock: { gt: 0 },
        gender: { in: [gender, 'unisex', 'Unisex'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const ep = (p: { price: number; discountAmount: number }) => p.price - p.discountAmount;

    const filtered = (
      budget === 'under30'
        ? allProducts.filter((p) => ep(p) < 30)
        : budget === '30-50'
        ? allProducts.filter((p) => ep(p) >= 30 && ep(p) <= 50)
        : allProducts
    ).slice(0, MAX_PRODUCTS);

    if (filtered.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const productList = buildProductList(filtered);

    const systemPrompt =
      language === 'hr'
        ? 'Parfumer si. Preporuči 2-3 parfema iz liste koji odgovaraju preferencijama. Odgovori SAMO JSON-om: [{"productId":br,"reason":"2 rečenice na hr"}]. Bez teksta van JSON-a.'
        : 'You are a perfumer. Recommend 2-3 perfumes from the list matching preferences. Respond ONLY as JSON: [{"productId":number,"reason":"2 sentences"}]. No text outside JSON.';

    const userMessage =
      language === 'hr'
        ? `Prigoda=${occasion}, intenzitet=${intensity}, mirisi=${scents.join('/')}, budžet=${budget}\n\nParfemi (br.brand naziv|cijena|profili|note):\n${productList}`
        : `Occasion=${occasion}, intensity=${intensity}, scents=${scents.join('/')}, budget=${budget}\n\nPerfumes (no.brand name|price|profiles|notes):\n${productList}`;

    return callClaude(systemPrompt, userMessage, filtered);
  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
