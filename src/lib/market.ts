import type { AssetMarket, Currency, MarketPoint, MarketSnapshot } from '../types';
import { clamp } from './cn';

const BASE_PRICES: Record<Currency, number> = {
  USDT: 1.0002,
  TON: 5.22,
  BTC: 108_450,
};

const STEP_VOLATILITY: Record<Currency, number> = {
  USDT: 0.00018,
  TON: 0.0038,
  BTC: 0.0016,
};

const BASE_VOLUME: Record<Currency, number> = {
  USDT: 4_820_000_000,
  TON: 184_500_000,
  BTC: 2_340_000_000,
};

const POINTS = 96;
const POINT_INTERVAL = 15 * 60 * 1000;
const TICK_INTERVAL = 1600;

function buildAsset(currency: Currency): AssetMarket {
  const now = Date.now();
  const base = BASE_PRICES[currency];
  let price = base * (1 + (Math.random() - 0.5) * 0.05);
  const points: MarketPoint[] = [];

  for (let index = 0; index < POINTS; index += 1) {
    const wave = Math.sin((index / POINTS) * Math.PI * 3.2 + currency.length) * STEP_VOLATILITY[currency] * 0.7;
    price = price * (1 + wave + (Math.random() - 0.5) * STEP_VOLATILITY[currency] * 2);
    points.push({
      t: now - (POINTS - 1 - index) * POINT_INTERVAL,
      price: Math.max(price, base * 0.75),
    });
  }

  const last = points[points.length - 1];
  price = last.price + (base - last.price) * 0.55;
  last.price = price;

  const first = points[0].price;
  const prices = points.map((point) => point.price);

  return {
    points,
    price,
    change24h: ((price - first) / first) * 100,
    high24h: Math.max(...prices),
    low24h: Math.min(...prices),
    volume24h: BASE_VOLUME[currency] * (0.94 + Math.random() * 0.12),
  };
}

function buildSnapshot(): MarketSnapshot {
  return {
    USDT: buildAsset('USDT'),
    TON: buildAsset('TON'),
    BTC: buildAsset('BTC'),
  };
}

class MarketFeed {
  private snapshot: MarketSnapshot = buildSnapshot();
  private subscribers = new Set<(snapshot: MarketSnapshot) => void>();
  private timer: number | null = null;

  getSnapshot(): MarketSnapshot {
    return this.snapshot;
  }

  subscribe(listener: (snapshot: MarketSnapshot) => void): () => void {
    this.subscribers.add(listener);
    listener(this.snapshot);
    this.ensureRunning();

    return () => {
      this.subscribers.delete(listener);
      if (this.subscribers.size === 0) this.stop();
    };
  }

  private ensureRunning(): void {
    if (this.timer !== null) return;
    this.timer = window.setInterval(() => this.tick(), TICK_INTERVAL);
  }

  private stop(): void {
    if (this.timer === null) return;
    window.clearInterval(this.timer);
    this.timer = null;
  }

  private tick(): void {
    const next = {} as MarketSnapshot;
    const now = Date.now();

    (Object.keys(this.snapshot) as Currency[]).forEach((currency) => {
      const current = this.snapshot[currency];
      const lastPrice = current.points[current.points.length - 1]?.price ?? BASE_PRICES[currency];
      const volatility = STEP_VOLATILITY[currency] * (currency === 'USDT' ? 0.35 : 0.55);
      const drift = (BASE_PRICES[currency] - lastPrice) / BASE_PRICES[currency] * 0.006;
      const nextPrice = Math.max(
        lastPrice * (1 + (Math.random() - 0.5) * volatility * 2 + drift),
        BASE_PRICES[currency] * 0.7,
      );

      const points = [...current.points.slice(-(POINTS - 1)), { t: now, price: nextPrice }];
      const prices = points.map((point) => point.price);
      const first = prices[0];
      const high24h = Math.max(current.high24h, nextPrice);
      const low24h = Math.min(current.low24h, nextPrice);

      next[currency] = {
        points,
        price: nextPrice,
        change24h: ((nextPrice - first) / first) * 100,
        high24h,
        low24h,
        volume24h: current.volume24h * (0.999 + Math.random() * 0.003),
      };
    });

    this.snapshot = next;
    this.subscribers.forEach((listener) => listener(this.snapshot));
  }
}

export const marketFeed = new MarketFeed();

const sparklineCache = new Map<Currency, number[]>();

export function getStaticSparkline(currency: Currency, count = 22): number[] {
  const cacheKey = currency;
  const cached = sparklineCache.get(cacheKey);
  if (cached) return cached;

  const asset = marketFeed.getSnapshot()[currency];
  const source = asset.points.map((point) => point.price);
  const step = Math.max(1, Math.floor(source.length / count));
  const sampled = source.filter((_, index) => index % step === 0).slice(-count);
  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const span = max - min || 1;
  const normalized = sampled.map((price) => clamp(18 + ((price - min) / span) * 82, 4, 98));
  sparklineCache.set(cacheKey, normalized);
  return normalized;
}

export function getAsset(currency: Currency): AssetMarket {
  return marketFeed.getSnapshot()[currency];
}
