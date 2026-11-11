import React, { createContext, useContext, useEffect, useState } from 'react';

interface CursorContextType {
  cursorEnabled: boolean;
  toggleCursor: () => void;
  setCursorEnabled: (enabled: boolean) => void;
  cursorLabel: string | null;
  setCursorLabel: (label: string | null) => void;
}

const CursorContext = createContext<CursorContextType>({
  cursorEnabled: true,
  toggleCursor: () => {},
  setCursorEnabled: () => {},
  cursorLabel: null,
  setCursorLabel: () => {},
});

export const CursorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cursorEnabled, setCursorEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('portfolio_custom_cursor');
    if (saved !== null) {
      return saved === 'true';
    }
    // Check if on touch-only device
    const isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    return !isTouch;
  });

  const [cursorLabel, setCursorLabel] = useState<string | null>(null);

  const setCursorEnabled = (enabled: boolean) => {
    setCursorEnabledState(enabled);
    localStorage.setItem('portfolio_custom_cursor', String(enabled));
  };

  const toggleCursor = () => {
    setCursorEnabledState((prev) => {
      const next = !prev;
      localStorage.setItem('portfolio_custom_cursor', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (cursorEnabled) {
      document.body.classList.add('custom-cursor-active');
    } else {
      document.body.classList.remove('custom-cursor-active');
    }

    return () => {
      document.body.classList.remove('custom-cursor-active');
    };
  }, [cursorEnabled]);

  return (
    <CursorContext.Provider
      value={{
        cursorEnabled,
        toggleCursor,
        setCursorEnabled,
        cursorLabel,
        setCursorLabel,
      }}
    >
      {children}
    </CursorContext.Provider>
  );
};

export const useCursor = () => useContext(CursorContext);
