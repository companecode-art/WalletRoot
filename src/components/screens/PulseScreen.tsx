import { useMemo, useState } from 'react';
import { Activity, HeartPulse, Radio, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../../state/AppContext';
import { useMarketSnapshot } from '../../hooks/useMarket';
import type { Currency } from '../../types';
import { formatMarketUsd, formatPercent } from '../../lib/format';
import { clamp, cn } from '../../lib/cn';
import { TokenIcon } from '../ui/TokenIcon';

type Range = '1Ч' | '6Ч' | '24Ч';

const ranges: Range[] = ['1Ч', '6Ч', '24Ч'];
const rangePoints: Record<Range, number> = { '1Ч': 16, '6Ч': 48, '24Ч': 96 };
const assets: Currency[] = ['USDT', 'TON', 'BTC'];

function formatVolume(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return formatMarketUsd(value);
}

export function PulseScreen() {
  const { theme } = useApp();
  const market = useMarketSnapshot();
  const [asset, setAsset] = useState<Currency>('TON');
  const [range, setRange] = useState<Range>('24Ч');

  const marketData = market[asset];
  const color = theme === 'matrix' ? '#42ff8f' : '#00ff9d';
  const changePositive = marketData.change24h >= 0;

  const chartData = useMemo(() => {
    return marketData.points
      .slice(-rangePoints[range])
      .map((point) => ({
        time: new Date(point.t).toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        price: point.price,
      }));
  }, [marketData.points, range]);

  const volatility = ((marketData.high24h - marketData.low24h) / marketData.price) * 100;
  const bpm = Math.round(clamp(64 + volatility * 24, 58, 148));
  const ChangeIcon = changePositive ? TrendingUp : TrendingDown;

  return (
    <div className="space-y-5 pt-1">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
            market heartbeat
          </p>
          <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.04em]">Crypto Pulse</h1>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            Имитация живого WebSocket-потока
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-accent)] bg-[var(--accent-dim)] px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--accent)]">
          <span className="pulse-dot" />
          live
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {assets.map((currency) => {
          const data = market[currency];
          const positive = data.change24h >= 0;
          return (
            <button
              key={currency}
              type="button"
              onClick={() => setAsset(currency)}
              aria-pressed={asset === currency}
              className={cn(
                'interactive rounded-2xl border p-2.5 text-left transition-colors',
                asset === currency
                  ? 'border-[var(--border-accent)] bg-[var(--accent-dim)]'
                  : 'border-[var(--border)] bg-[var(--surface)]',
              )}
            >
              <div className="flex items-center gap-1.5">
                <TokenIcon currency={currency} size="xs" />
                <span className="font-mono text-[9px] font-semibold text-[var(--text)]">
                  {currency}
                </span>
              </div>
              <p
                className={cn(
                  'mt-2 font-mono text-[8px]',
                  positive ? 'text-[var(--accent)]' : 'text-[var(--danger)]',
                )}
              >
                {formatPercent(data.change24h)}
              </p>
            </button>
          );
        })}
      </div>

      <section className="glass-accent relative overflow-hidden rounded-3xl p-4">
        <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-[var(--accent)] opacity-[0.07] blur-3xl" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TokenIcon currency={asset} size="sm" />
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                {asset} / USDT
              </span>
            </div>
            <p className="num mt-3 text-[34px] font-semibold leading-none tracking-[-0.045em]">
              {formatMarketUsd(marketData.price)}
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <ChangeIcon
                size={12}
                className={changePositive ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}
              />
              <span
                className={cn(
                  'font-mono text-[10px] font-medium',
                  changePositive ? 'text-[var(--accent)]' : 'text-[var(--danger)]',
                )}
              >
                {formatPercent(marketData.change24h)}
              </span>
              <span className="font-mono text-[8px] text-[var(--text-faint)]">за 24ч</span>
            </div>
          </div>

          <div className="flex rounded-lg border border-[var(--border)] bg-black/20 p-0.5">
            {ranges.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                aria-pressed={range === item}
                className={cn(
                  'rounded-[7px] px-2 py-1 font-mono text-[8px] transition-colors',
                  range === item
                    ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                    : 'text-[var(--text-faint)]',
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pulseArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                  <stop offset="70%" stopColor={color} stopOpacity={0.03} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="rgba(255,255,255,0.055)"
                strokeDasharray="2 7"
              />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                minTickGap={36}
                interval="preserveStartEnd"
                tick={{ fill: 'var(--text-faint)', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                dy={6}
              />
              <YAxis
                hide
                domain={[
                  (min: number) => min * 0.999,
                  (max: number) => max * 1.001,
                ]}
              />
              <Tooltip
                cursor={{ stroke: color, strokeDasharray: '3 4', strokeOpacity: 0.6 }}
                contentStyle={{
                  background: 'var(--surface-strong)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: 12,
                  boxShadow: '0 16px 40px rgba(0,0,0,.45)',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                  color: 'var(--text)',
                }}
                labelStyle={{ color: 'var(--text-muted)', fontSize: 8, marginBottom: 4 }}
                itemStyle={{ color: color, fontFamily: 'JetBrains Mono', fontSize: 11 }}
                formatter={(value) => [formatMarketUsd(Number(value)), asset]}
                labelFormatter={(label) => `${label} · demo`}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={color}
                strokeWidth={2}
                fill="url(#pulseArea)"
                isAnimationActive={false}
                activeDot={{
                  r: 3.5,
                  fill: color,
                  stroke: 'var(--bg)',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-[var(--border-soft)] pt-2.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
          <span className="flex items-center gap-1.5">
            <Radio size={10} className="text-[var(--accent)]" />
            tick ~1.6s
          </span>
          <span>demo feed · not real market data</span>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="glass rounded-2xl p-3.5">
          <p className="label-caps text-[8px]">Максимум 24ч</p>
          <p className="num mt-2 text-[15px] font-semibold">{formatMarketUsd(marketData.high24h)}</p>
        </div>
        <div className="glass rounded-2xl p-3.5">
          <p className="label-caps text-[8px]">Минимум 24ч</p>
          <p className="num mt-2 text-[15px] font-semibold">{formatMarketUsd(marketData.low24h)}</p>
        </div>
        <div className="glass rounded-2xl p-3.5">
          <p className="label-caps text-[8px]">Объём 24ч</p>
          <p className="num mt-2 text-[15px] font-semibold">{formatVolume(marketData.volume24h)}</p>
        </div>
        <div className="glass rounded-2xl p-3.5">
          <p className="label-caps text-[8px]">Волатильность</p>
          <p className="num mt-2 text-[15px] font-semibold text-[var(--accent)]">
            {volatility.toFixed(2)}%
          </p>
        </div>
      </div>

      <section className="glass relative overflow-hidden rounded-3xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl border border-[var(--border-accent)] bg-[var(--accent-dim)] text-[var(--accent)]">
              <HeartPulse size={15} />
            </div>
            <div>
              <p className="text-[12px] font-semibold">Пульс рынка</p>
              <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
                {asset} · активность сети
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="num text-[24px] font-semibold leading-none neon-text">{bpm}</p>
            <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
              bpm
            </p>
          </div>
        </div>

        <div className="relative mt-4 h-16 overflow-hidden rounded-xl border border-[var(--border-soft)] bg-black/20">
          <svg viewBox="0 0 360 64" preserveAspectRatio="none" className="h-full w-full">
            <path
              d="M0 36 H76 L86 36 L93 18 L102 50 L111 26 L120 36 H166 L178 36 L186 12 L196 54 L206 22 L216 36 H262 L272 36 L280 17 L290 48 L300 25 L310 36 H360"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ecg-path"
              style={{ filter: 'drop-shadow(0 0 5px rgba(0,255,157,.55))' }}
            />
          </svg>
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--surface-strong)] to-transparent" />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--accent)]">
            <span className="pulse-dot" />
            рынок активен
          </span>
          <span className="font-mono text-[8px] text-[var(--text-faint)]">
            волатильность {volatility.toFixed(2)}%
          </span>
        </div>
      </section>

      <div className="flex items-start gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] px-3.5 py-3">
        <Activity size={13} className="mt-0.5 shrink-0 text-[var(--text-faint)]" />
        <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">
          Цены генерируются локально и имитируют WebSocket-поток для демонстрации. Реальные
          котировки можно подключить через бэкенд.
        </p>
      </div>
    </div>
  );
}
