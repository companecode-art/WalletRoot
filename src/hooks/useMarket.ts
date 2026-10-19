import { useEffect, useState } from 'react';
import type { MarketSnapshot } from '../types';
import { marketFeed } from '../lib/market';

export function useMarketSnapshot(): MarketSnapshot {
  const [snapshot, setSnapshot] = useState<MarketSnapshot>(() => marketFeed.getSnapshot());

  useEffect(() => marketFeed.subscribe(setSnapshot), []);

  return snapshot;
}
