import { useEffect, useRef } from 'react';

const GLYPHS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモ';

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const fontSize = 14;
    let columns = 0;
    let drops: number[] = [];

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      columns = Math.ceil(window.innerWidth / fontSize);
      drops = Array.from({ length: columns }, () =>
        Math.floor(Math.random() * (window.innerHeight / fontSize)),
      );
    };

    resize();

    const draw = () => {
      context.fillStyle = 'rgba(1, 6, 3, 0.16)';
      context.fillRect(0, 0, window.innerWidth, window.innerHeight);
      context.font = `${fontSize}px "JetBrains Mono Variable", monospace`;

      for (let column = 0; column < columns; column += 1) {
        const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        const x = column * fontSize;
        const y = drops[column] * fontSize;

        context.fillStyle = Math.random() > 0.985 ? '#d8ffe7' : 'rgba(66,255,143,0.78)';
        context.fillText(glyph, x, y);

        if (y > window.innerHeight && Math.random() > 0.978) {
          drops[column] = 0;
        } else {
          drops[column] += 1;
        }
      }
    };

    const interval = window.setInterval(draw, 58);
    window.addEventListener('resize', resize);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-[0.14]"
      aria-hidden="true"
    />
  );
}
