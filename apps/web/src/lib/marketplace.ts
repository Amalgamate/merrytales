const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  category: string;
  listingType: 'PRODUCT' | 'SERVICE' | 'RENTAL' | 'PACKAGE';
  priceUnit: string;
  price: string | number;
  currency: string;
  isDigital: boolean;
  minimumOrder: number;
  maximumOrder?: number | null;
  leadTimeDays: number;
  serviceArea?: string | null;
  depositAmount?: string | number | null;
  terms?: string | null;
  vendor?: {
    id?: string;
    businessName: string;
    slug: string;
    city: string;
    rating: string | number;
    reviewCount?: number;
    whatsapp?: string | null;
    startingPrice?: string | number | null;
    responseMinutes?: number | null;
  } | null;
}

export interface ApiVendor {
  id: string;
  slug: string;
  businessName: string;
  category: string;
  description?: string | null;
  city: string;
  whatsapp?: string | null;
  startingPrice?: string | number | null;
  rating: string | number;
  reviewCount: number;
  responseMinutes?: number | null;
  services?: { id: string; name: string; description?: string | null; price?: string | number | null }[];
  products?: ApiProduct[];
  reviews?: { id: string; authorName: string; rating: number; body?: string | null; verified: boolean; createdAt: string }[];
}

export interface ProductCardModel {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory: string;
  startingPrice: number;
  image: string;
  bestseller?: boolean;
  digital?: boolean;
  listingType?: string;
  vendorName?: string;
  vendorSlug?: string;
}

export interface VendorCardModel {
  id: string;
  slug: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  startingPrice: number;
  verified: boolean;
  image: string;
  logo: string;
  responseTime: string;
}

const categoryImages: Record<string, string> = {
  'Wedding Details': '/printable_water_labels.png',
  'Wedding Print': '/printable_invitation_cards.png',
  'Digital Invitations': '/event_branding_mockup.png',
  'Event Branding': '/event_branding_mockup.png',
  'Corporate Gifts': '/event_branding_mockup.png',
  'Gifts & Hampers': '/hero_vibrant.png',
  'Baby & Kids': '/hero_vibrant.png',
  'Flowers & Decor': '/african_garden_wedding.png',
  'Printing & Branding': '/printable_invitation_cards.png',
  'Fashion & Merchandise': '/style_story_tale.png',
  'Jewellery & Accessories': '/style_story_tale.png',
  'Limousine Hire': '/african_planning_hero.png',
  'Event MCs': '/african_stories_hero.png',
  'Corporate Printing': '/printable_invitation_cards.png',
  'Event Rentals': '/african_planning_hero.png',
};

const vendorCategoryImages: Record<string, string> = {
  Photography: '/african_vendor_photography.png',
  Florists: '/african_garden_wedding.png',
  'Digital Printers': '/printable_invitation_cards.png',
  'Limousine Hire': '/african_planning_hero.png',
  'Event MCs': '/african_stories_hero.png',
  Tents: '/african_planning_hero.png',
  'Corporate Gifts': '/hero_vibrant.png',
  'Baby Shops': '/hero_vibrant.png',
  Tailors: '/style_story_tale.png',
  Jewellers: '/style_story_tale.png',
  'LED Screens': '/event_branding_mockup.png',
};

export function productImage(category: string, listingType?: string) {
  if (listingType === 'RENTAL') return '/african_planning_hero.png';
  if (listingType === 'SERVICE') return '/african_stories_hero.png';
  return categoryImages[category] ?? '/hero_vibrant.png';
}

export function vendorImage(category: string) {
  return vendorCategoryImages[category] ?? '/african_vendor_hero.png';
}

export function formatResponseTime(minutes?: number | null) {
  if (!minutes) return 'Replies within a day';
  if (minutes <= 60) return 'Replies in about 1 hour';
  if (minutes <= 180) return `Replies in ${Math.round(minutes / 60)} hours`;
  return 'Replies within a day';
}

export function toProductCard(product: ApiProduct): ProductCardModel {
  const price = Number(product.price);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    subcategory: product.listingType.replace('_', ' '),
    startingPrice: price,
    image: productImage(product.category, product.listingType),
    bestseller: price >= 8000 && product.listingType === 'PRODUCT',
    digital: product.isDigital,
    listingType: product.listingType,
    vendorName: product.vendor?.businessName,
    vendorSlug: product.vendor?.slug,
  };
}

export function toVendorCard(vendor: ApiVendor): VendorCardModel {
  return {
    id: vendor.id,
    slug: vendor.slug,
    name: vendor.businessName,
    category: vendor.category,
    location: vendor.city,
    rating: Number(vendor.rating),
    reviews: vendor.reviewCount,
    startingPrice: Number(vendor.startingPrice ?? 0),
    verified: true,
    image: vendorImage(vendor.category),
    logo: vendorImage(vendor.category),
    responseTime: formatResponseTime(vendor.responseMinutes),
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  const body = await response.json().catch(() => ({})) as { data?: T; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? 'Unable to load marketplace data.');
  return body.data as T;
}

export async function fetchProducts(params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)); });
  const query = search.toString();
  const response = await fetch(`${API_URL}/products${query ? `?${query}` : ''}`);
  const body = await response.json().catch(() => ({})) as { data?: ApiProduct[]; meta?: { total: number; page: number; pages: number }; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? 'Unable to load products.');
  return { items: body.data ?? [], meta: body.meta };
}

export async function fetchProduct(slug: string) {
  return fetchJson<ApiProduct>(`/products/${slug}`);
}

export async function fetchVendors(params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)); });
  const query = search.toString();
  const response = await fetch(`${API_URL}/vendors${query ? `?${query}` : ''}`);
  const body = await response.json().catch(() => ({})) as { data?: ApiVendor[]; meta?: { total: number }; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? 'Unable to load vendors.');
  return { items: body.data ?? [], meta: body.meta };
}

export async function fetchVendor(slug: string) {
  return fetchJson<ApiVendor>(`/vendors/${slug}`);
}

export async function submitLead(input: { vendorId: string; name: string; email?: string; phone?: string; eventDate?: string; message: string }) {
  const response = await fetch(`${API_URL}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => ({})) as { error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? 'Unable to send your request.');
}

export function priceLabel(product: ApiProduct) {
  const amount = Number(product.price).toLocaleString('en-KE');
  const unit = product.priceUnit === 'ITEM' ? '' : ` / ${product.priceUnit.toLowerCase().replace('_', ' ')}`;
  return `KES ${amount}${unit}`;
}
