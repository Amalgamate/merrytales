import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export interface MarketplaceCategory {
  name: string;
  slug: string;
  description: string;
  subcategories: string[];
}

// In-memory cache so all components share one fetch
let cache: MarketplaceCategory[] | null = null;
let inflight: Promise<MarketplaceCategory[]> | null = null;

async function fetchCategories(): Promise<MarketplaceCategory[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetch(`${API_URL}/products/categories`)
      .then(r => r.json())
      .then((body: { data: MarketplaceCategory[] }) => {
        cache = body.data;
        return body.data;
      })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

export function useMarketplaceCategories() {
  const [categories, setCategories] = useState<MarketplaceCategory[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    setLoading(true);
    fetchCategories()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}
