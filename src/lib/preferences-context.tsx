"use client";

import { createContext, useContext } from "react";

interface UserPrefs {
  currency: string;
  currencySymbol: string;
  locale: string;
  timezone: string;
}

const defaultPrefs: UserPrefs = {
  currency: "INR",
  currencySymbol: "₹",
  locale: "en-IN",
  timezone: "Asia/Kolkata",
};

const PreferencesContext = createContext<UserPrefs>(defaultPrefs);

export function PreferencesProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: UserPrefs;
}) {
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
