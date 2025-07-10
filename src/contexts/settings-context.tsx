
'use client';

import React from 'react';
import type { Settings } from '@/lib/types';
import { getSettings } from '@/lib/actions';

type SettingsContextType = {
  settings: Settings | null;
  loading: boolean;
  isSetupComplete: boolean;
  reloadSettings: () => Promise<void>;
};

const SettingsContext = React.createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  const isSetupComplete = React.useMemo(() => {
    if (!settings) return false;
    return !!(
      settings.defaults?.fromEmail &&
      settings.defaults?.fromName &&
      settings.profile?.companyName &&
      settings.profile?.address
    );
  }, [settings]);

  const reloadSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const freshSettings = await getSettings();
      setSettings(freshSettings);
    } catch (error) {
      console.error("Failed to reload settings", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    reloadSettings();
  }, [reloadSettings]);

  const value = { settings, loading, isSetupComplete, reloadSettings };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = React.useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
