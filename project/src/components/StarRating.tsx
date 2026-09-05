import { Star } from 'lucide-react';

const FILLED = 'fill-amber-400 text-amber-400';
const EMPTY = 'fill-neutral-700 text-neutral-700';

export default function StarRating({ rating, size = 'w-4 h-4' }: { rating: number | null; size?: string }) {
  const hasRating = rating !== null && rating >= 0 && rating <= 5;
  const displayRating = hasRating ? rating : 0;
  const fillPercent = (displayRating / 5) * 100;

  return (
    <div className="relative inline-flex">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={`${size} ${EMPTY}`} />
        ))}
      </div>
      {hasRating && (
        <div className="absolute left-0 top-0 overflow-hidden flex items-center gap-1" style={{ width: `${fillPercent}%` }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`${size} ${FILLED} shrink-0`} />
          ))}
        </div>
      )}
    </div>
  );
}
