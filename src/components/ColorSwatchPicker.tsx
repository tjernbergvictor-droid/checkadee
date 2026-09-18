import { LIST_COLORS } from '../types';
import { CheckIcon } from './icons';

export default function ColorSwatchPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      {LIST_COLORS.map((color) => {
        const selected = value === color;
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="flex h-10 w-10 items-center justify-center rounded-full ring-offset-2 transition-transform hover:scale-105"
            style={{ backgroundColor: color, boxShadow: selected ? `0 0 0 2px white, 0 0 0 4px ${color}` : undefined }}
            aria-label={color}
          >
            {selected && <CheckIcon width={18} height={18} color="white" />}
          </button>
        );
      })}
    </div>
  );
}
