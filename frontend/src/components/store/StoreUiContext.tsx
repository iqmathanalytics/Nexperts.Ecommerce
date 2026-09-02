"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type StoreUiContextValue = {
  miniCartOpen: boolean;
  openMiniCart: () => void;
  closeMiniCart: () => void;
  toggleMiniCart: () => void;
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  cartPulse: number;
  pulseCart: () => void;
};

const StoreUiContext = createContext<StoreUiContextValue | null>(null);

export function StoreUiProvider({ children }: { children: ReactNode }) {
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartPulse, setCartPulse] = useState(0);

  const openMiniCart = useCallback(() => setMiniCartOpen(true), []);
  const closeMiniCart = useCallback(() => setMiniCartOpen(false), []);
  const toggleMiniCart = useCallback(() => setMiniCartOpen((v) => !v), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const pulseCart = useCallback(() => setCartPulse((n) => n + 1), []);

  const value = useMemo(
    () => ({
      miniCartOpen,
      openMiniCart,
      closeMiniCart,
      toggleMiniCart,
      searchOpen,
      openSearch,
      closeSearch,
      cartPulse,
      pulseCart,
    }),
    [miniCartOpen, openMiniCart, closeMiniCart, toggleMiniCart, searchOpen, openSearch, closeSearch, cartPulse, pulseCart],
  );

  return <StoreUiContext.Provider value={value}>{children}</StoreUiContext.Provider>;
}

export function useStoreUi() {
  const ctx = useContext(StoreUiContext);
  if (!ctx) throw new Error("useStoreUi must be used within StoreUiProvider");
  return ctx;
}
