'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value?: number;
  onRate?: (rating: number) => void;
  readOnly?: boolean;
  size?: number;
}

// A simple 1-5 star picker. Pass `readOnly` to just display a saved rating.
export function StarRating({ value = 0, onRate, readOnly = false, size = 32 }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onRate?.(n)}
          className="transition-transform disabled:cursor-default enabled:hover:scale-110"
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            style={{ width: size, height: size }}
            className={shown >= n ? 'fill-accent text-accent' : 'text-muted-foreground/40'}
          />
        </button>
      ))}
    </div>
  );
}
