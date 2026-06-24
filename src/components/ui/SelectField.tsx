import { useState, useRef, useEffect } from 'react';

export interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  className?: string;
}

export default function SelectField({
  id,
  value,
  onChange,
  options,
  disabled = false,
  className = '',
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(opt => opt.value === value) || options[0];
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex(opt => opt.value === value);
      const nextIndex = (currentIndex + 1) % options.length;
      onChange(options[nextIndex].value);
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex(opt => opt.value === value);
      const prevIndex = (currentIndex - 1 + options.length) % options.length;
      onChange(options[prevIndex].value);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      id={id}
    >
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`form-select text-left flex items-center justify-between min-h-[46px] w-full ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate pr-4 text-text">{selectedOption?.label || ''}</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 max-h-60 overflow-y-auto bg-[#27272a] border border-[#3f3f46] rounded-xl shadow-2xl py-1">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-4 py-2.5 text-left text-sm cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-primary/20 text-[#fafafa] font-semibold'
                    : 'text-[#a1a1aa] hover:bg-white/5 hover:text-[#fafafa]'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
