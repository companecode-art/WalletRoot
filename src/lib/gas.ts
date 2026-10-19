export interface GasHour {
  hour: number;
  label: string;
  gas: number;
  height: number;
  isBest: boolean;
  isCurrent: boolean;
}

export interface GasAdvice {
  current: number;
  level: 'low' | 'medium' | 'high';
  bestLabel: string;
  bestStart: number;
  bestEnd: number;
  savingsPercent: number;
  headline: string;
  recommendation: string;
  hours: GasHour[];
}

const HOURLY_GAS = [
  32, 28, 25, 22, 20, 21, 27, 37, 52, 61, 58, 54, 48, 45, 47, 53, 59, 64, 61,
  53, 46, 41, 37, 34,
];

const HOUR_WINDOW = 8;

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

export function getGasAdvice(now = new Date()): GasAdvice {
  const currentHour = now.getHours();
  const current = HOURLY_GAS[currentHour];

  const windowHours: Array<{ hour: number; gas: number; avg?: number }> = [];
  for (let offset = 0; offset < HOUR_WINDOW; offset += 1) {
    const hour = (currentHour + offset) % 24;
    windowHours.push({ hour, gas: HOURLY_GAS[hour] });
  }

  let bestStart = windowHours[0].hour;
  let bestEnd = windowHours[1].hour;
  let bestAverage = Number.POSITIVE_INFINITY;

  for (let index = 0; index < windowHours.length - 1; index += 1) {
    const pair = windowHours.slice(index, index + 2);
    const average = (pair[0].gas + pair[1].gas) / 2;
    if (average < bestAverage) {
      bestAverage = average;
      bestStart = pair[0].hour;
      bestEnd = pair[1].hour;
    }
  }

  const savingsPercent = Math.max(0, Math.round(((current - bestAverage) / current) * 100));
  const level = current < 30 ? 'low' : current < 50 ? 'medium' : 'high';
  const bestLabel = `${formatHour(bestStart)}–${((bestEnd + 1) % 24).toString().padStart(2, '0')}:00`;
  const maxGas = Math.max(...windowHours.map((item) => item.gas));

  const hours: GasHour[] = windowHours.map((item) => ({
    hour: item.hour,
    label: formatHour(item.hour),
    gas: item.gas,
    height: Math.max(16, Math.round((item.gas / maxGas) * 100)),
    isBest: item.hour === bestStart || item.hour === bestEnd,
    isCurrent: item.hour === currentHour,
  }));

  const headline =
    level === 'low'
      ? 'Сеть спокойна'
      : level === 'medium'
        ? 'Средняя нагрузка'
        : 'Сеть перегружена';

  const recommendation =
    savingsPercent >= 15
      ? `Лучшее окно — ${bestLabel}. Комиссия ниже примерно на ${savingsPercent}%.`
      : `Сейчас комфортное окно для перевода. Следующий спад — ${bestLabel}.`;

  return {
    current,
    level,
    bestLabel,
    bestStart,
    bestEnd,
    savingsPercent,
    headline,
    recommendation,
    hours,
  };
}
