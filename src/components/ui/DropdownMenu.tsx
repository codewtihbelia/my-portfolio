import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export interface DropdownMenuItem {
  id?: string;
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  to?: string;
  href?: string;
  danger?: boolean;
  badge?: string;
  badgeColor?: string;
  separator?: boolean;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode | ((isOpen: boolean) => React.ReactNode);
  items?: DropdownMenuItem[];
  children?: React.ReactNode;
  align?: 'left' | 'right';
  widthClass?: string;
  className?: string;
  containerClassName?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  children,
  align = 'right',
  widthClass = 'w-56',
  className = '',
  containerClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const alignClass = align === 'left' ? 'left-0 origin-top-left' : 'right-0 origin-top-right';

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${containerClassName}`}>
      <div 
        onClick={() => setIsOpen((prev) => !prev)}
        className="cursor-pointer select-none inline-flex items-center"
      >
        {typeof trigger === 'function' ? trigger(isOpen) : trigger}
      </div>

      {isOpen && (
        <div
          role="menu"
          className={`absolute ${alignClass} mt-2 ${widthClass} rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 ring-1 ring-black/5 dark:ring-white/10 shadow-2xl shadow-zinc-900/10 dark:shadow-black/70 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${className}`}
        >
          {items && (
            <div className="space-y-0.5">
              {items.map((item, index) => {
                if (item.separator) {
                  return (
                    <div
                      key={`sep-${index}`}
                      className="my-1 border-t border-zinc-100 dark:border-zinc-800/80"
                    />
                  );
                }

                const ItemIcon = item.icon;
                const baseClasses = `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  item.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : item.danger
                    ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80'
                }`;

                const content = (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      {ItemIcon && (
                        <ItemIcon
                          className={`w-4 h-4 shrink-0 ${
                            item.danger
                              ? 'text-rose-500 dark:text-rose-400'
                              : 'text-zinc-400 dark:text-zinc-500'
                          }`}
                        />
                      )}
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-wide ml-2 shrink-0 ${
                          item.badgeColor ||
                          'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                );

                if (item.to) {
                  return (
                    <Link
                      key={item.id || item.label || index}
                      to={item.to}
                      onClick={() => setIsOpen(false)}
                      className={baseClasses}
                    >
                      {content}
                    </Link>
                  );
                }

                if (item.href) {
                  return (
                    <a
                      key={item.id || item.label || index}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsOpen(false)}
                      className={baseClasses}
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <button
                    key={item.id || item.label || index}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => {
                      if (!item.disabled && item.onClick) {
                        item.onClick();
                        setIsOpen(false);
                      }
                    }}
                    className={baseClasses}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          )}

          {children}
        </div>
      )}
    </div>
  );
};
