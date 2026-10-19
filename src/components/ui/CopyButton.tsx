import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyToClipboard } from '../../lib/clipboard';
import { haptic } from '../../telegram/telegram';
import { cn } from '../../lib/cn';

interface CopyButtonProps {
  text: string;
  className?: string;
  label?: string;
  size?: 'sm' | 'md';
  onCopied?: () => void;
}

export function CopyButton({ text, className, label, size = 'md', onCopied }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (!success) return;
    setCopied(true);
    haptic('success');
    onCopied?.();
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const iconSize = size === 'sm' ? 13 : 15;
  const boxSize = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={label ?? 'Скопировать'}
      className={cn(
        'interactive grid shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-muted)] hover:text-[var(--accent)]',
        boxSize,
        copied && 'border-[var(--border-accent)] bg-[var(--accent-dim)] text-[var(--accent)]',
        className,
      )}
    >
      {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
    </button>
  );
}
