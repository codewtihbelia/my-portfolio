import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useMemo,
  useId,
} from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
  badgeColor?: string;
  dotColor?: string;
}

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ComponentType<{ className?: string }>;
  options?: SelectOption[];
  containerClassName?: string;
  sizeVariant?: "sm" | "md" | "lg";
  searchable?: boolean;
  placeholder?: string;
  clearable?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      icon: LeadingIcon,
      options,
      children,
      className = "",
      containerClassName = "",
      sizeVariant = "md",
      disabled = false,
      id,
      value,
      defaultValue,
      onChange,
      name,
      placeholder = "Select option...",
      searchable,
      clearable = false,
      required,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const generatedId =
      id ||
      (label
        ? `select-${label.toLowerCase().replace(/\s+/g, "-")}`
        : `select-${autoId}`);
    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenSelectRef = useRef<HTMLSelectElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState<string>(
      value !== undefined
        ? String(value)
        : defaultValue !== undefined
          ? String(defaultValue)
          : "",
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

    // Sync internal value when controlled value changes
    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(String(value));
      }
    }, [value]);

    // Extract options from options prop OR React option children
    const parsedOptions: SelectOption[] = useMemo(() => {
      if (options && options.length > 0) {
        return options;
      }
      if (!children) return [];

      const extracted: SelectOption[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === "option") {
          const p = child.props as any;
          extracted.push({
            value: String(p.value ?? ""),
            label:
              typeof p.children === "string"
                ? p.children
                : String(p.value ?? ""),
            disabled: Boolean(p.disabled),
          });
        }
      });
      return extracted;
    }, [options, children]);

    // Current selected option object
    const currentSelectedOption = useMemo(() => {
      return parsedOptions.find(
        (opt) => String(opt.value) === String(internalValue),
      );
    }, [parsedOptions, internalValue]);

    // Determine whether search input should be visible
    const shouldShowSearch = searchable ?? parsedOptions.length > 7;

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return parsedOptions;
      const q = searchQuery.toLowerCase().trim();
      return parsedOptions.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          opt.value.toLowerCase().includes(q) ||
          opt.description?.toLowerCase().includes(q),
      );
    }, [parsedOptions, searchQuery]);

    // Close when clicking outside
    useEffect(() => {
      const handleOutsideClick = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchQuery("");
          setHighlightedIndex(-1);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleOutsideClick);
        // Auto focus search field if open
        if (shouldShowSearch) {
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
      }

      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
      };
    }, [isOpen, shouldShowSearch]);

    const handleSelectOption = (opt: SelectOption) => {
      if (opt.disabled) return;

      const newValue = opt.value;
      if (value === undefined) {
        setInternalValue(newValue);
      }

      // Trigger synthetic change event for React forms compatibility
      if (onChange) {
        const syntheticEvent = {
          target: {
            name: name || "",
            value: newValue,
            id: generatedId,
          },
          currentTarget: {
            name: name || "",
            value: newValue,
            id: generatedId,
          },
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }

      if (hiddenSelectRef.current) {
        hiddenSelectRef.current.value = newValue;
        hiddenSelectRef.current.dispatchEvent(
          new Event("change", { bubbles: true }),
        );
      }

      setIsOpen(false);
      setSearchQuery("");
      setHighlightedIndex(-1);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (value === undefined) {
        setInternalValue("");
      }
      if (onChange) {
        const syntheticEvent = {
          target: {
            name: name || "",
            value: "",
            id: generatedId,
          },
          currentTarget: {
            name: name || "",
            value: "",
            id: generatedId,
          },
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (
            highlightedIndex >= 0 &&
            highlightedIndex < filteredOptions.length
          ) {
            handleSelectOption(filteredOptions[highlightedIndex]);
          }
          break;
        case "Escape":
        case "Tab":
          setIsOpen(false);
          setSearchQuery("");
          setHighlightedIndex(-1);
          break;
      }
    };

    const sizeClasses = {
      sm: "py-1.5 pr-2.5 text-xs rounded-xl min-h-[32px]",
      md: "py-2 pr-3 text-xs sm:text-sm rounded-xl min-h-[38px]",
      lg: "py-2.5 pr-3.5 text-sm rounded-xl min-h-[44px]",
    };

    const leftPaddingClasses = {
      sm: LeadingIcon ? "pl-8" : "pl-2.5",
      md: LeadingIcon ? "pl-9" : "pl-3",
      lg: LeadingIcon ? "pl-10" : "pl-3.5",
    };

    const SelectedIcon = currentSelectedOption?.icon;

    return (
      <div
        ref={containerRef}
        className={`w-full relative ${containerClassName}`}
      >
        {label && (
          <label
            htmlFor={generatedId}
            className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5 cursor-pointer"
            onClick={() => !disabled && setIsOpen((prev) => !prev)}
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        {/* Hidden Native Select for standard form access, autocomplete, and accessibility */}
        <select
          ref={(el) => {
            hiddenSelectRef.current = el;
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
          }}
          id={generatedId}
          name={name}
          value={internalValue}
          onChange={onChange}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none opacity-0 absolute inset-0"
          required={required}
          {...props}
        >
          <option value="">{placeholder}</option>
          {parsedOptions.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom Trigger Button */}
        <div className="relative">
          {LeadingIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-zinc-500 transition-colors z-10">
              <LeadingIcon
                className={sizeVariant === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"}
              />
            </div>
          )}

          <button
            type="button"
            id={`${generatedId}-trigger`}
            disabled={disabled}
            onClick={() => setIsOpen((prev) => !prev)}
            onKeyDown={handleKeyDown}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby={label ? `${generatedId}-label` : undefined}
            className={`w-full text-left font-medium transition-all duration-150 flex items-center justify-between cursor-pointer
            border shadow-xs outline-none select-none
            ${sizeClasses[sizeVariant]}
            ${leftPaddingClasses[sizeVariant]}
            ${
              isOpen
                ? "border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 bg-white dark:bg-zinc-800"
                : error
                  ? "border-rose-300 dark:border-rose-700 ring-1 ring-rose-500/20 bg-white dark:bg-zinc-800/90"
                  : "border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800/90 hover:bg-zinc-50/50 dark:hover:bg-zinc-800"
            }
            ${disabled ? "opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" : ""}
            ${className}
          `}
          >
            {/* Label / Selected Content */}
            <div className="flex items-center gap-2 min-w-0 pr-2">
              {/* Optional dot indicator for status */}
              {currentSelectedOption?.dotColor && (
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${currentSelectedOption.dotColor}`}
                />
              )}

              {/* Optional icon from option */}
              {SelectedIcon && (
                <SelectedIcon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
              )}

              {currentSelectedOption ? (
                <span className="truncate text-zinc-900 dark:text-zinc-100 font-medium">
                  {currentSelectedOption.label}
                </span>
              ) : (
                <span className="truncate text-zinc-400 dark:text-zinc-500 font-normal">
                  {placeholder}
                </span>
              )}

              {/* Optional badge */}
              {currentSelectedOption?.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-wide shrink-0 ${currentSelectedOption.badgeColor || "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"}`}
                >
                  {currentSelectedOption.badge}
                </span>
              )}
            </div>

            {/* Action indicators: Clear button & Chevron */}
            <div className="flex items-center gap-1 shrink-0">
              {clearable && internalValue && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded transition-colors"
                  title="Clear selection"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}

              <div
                className={`text-zinc-400 dark:text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-indigo-600 dark:text-indigo-400" : ""}`}
              >
                <ChevronDown
                  className={sizeVariant === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"}
                />
              </div>
            </div>
          </button>
        </div>

        {/* Floating Custom Dropdown Menu */}
        {isOpen && (
          <div
            id={`${generatedId}-menu`}
            role="listbox"
            tabIndex={-1}
            className="absolute z-50 mt-1.5 left-0 right-0 min-w-50 w-full rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 ring-1 ring-black/5 dark:ring-white/10 shadow-2xl shadow-zinc-900/10 dark:shadow-black/70 p-1.5 animate-in fade-in zoom-in-95 duration-150 origin-top"
          >
            {/* Search Bar inside popover if applicable */}
            {shouldShowSearch && (
              <div className="p-1.5 mb-1 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Filter options..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedIndex(0);
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto thin-scrollbar space-y-0.5">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
                  No matching options found
                </div>
              ) : (
                filteredOptions.map((opt, index) => {
                  const isSelected =
                    String(opt.value) === String(internalValue);
                  const isHighlighted = highlightedIndex === index;
                  const OptIcon = opt.icon;

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={opt.disabled}
                      onClick={() => handleSelectOption(opt)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm text-left transition-all duration-150 cursor-pointer ${
                        opt.disabled
                          ? "opacity-40 cursor-not-allowed bg-transparent"
                          : isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs"
                            : isHighlighted
                              ? "bg-zinc-100/90 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                              : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {opt.dotColor && (
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${opt.dotColor}`}
                          />
                        )}
                        {OptIcon && (
                          <OptIcon
                            className={`w-4 h-4 shrink-0 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500"}`}
                          />
                        )}
                        <div className="min-w-0">
                          <div className="truncate">{opt.label}</div>
                          {opt.description && (
                            <div className="text-[11px] font-normal text-zinc-400 dark:text-zinc-500 truncate">
                              {opt.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {opt.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-wide ${opt.badgeColor || "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}
                          >
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {error ? (
          <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = "Select";
