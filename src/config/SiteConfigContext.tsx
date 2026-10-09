import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type SiteConfig, validateConfig, createDefaultConfig } from './site-config';

interface SiteConfigContextType {
  config: SiteConfig | null;
  isLoading: boolean;
  error: string | null;
  updateConfig: (config: SiteConfig) => Promise<void>;
  reload: () => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextType | null>(null);

const CONFIG_STORAGE_KEY = 'cpabook_site_config';

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Try API first (worker-backed D1 config)
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          const result = validateConfig(data);
          if (result.success) {
            setConfig(result.config);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Worker not available — fall back to localStorage
      }

      // Fallback: localStorage (dev mode or standalone frontend)
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const result = validateConfig(parsed);
        if (result.success) {
          setConfig(result.config);
        } else {
          setError(`Invalid stored config: ${result.errors.join(', ')}`);
          setConfig(null);
        }
      } else {
        // No config — show setup wizard
        setConfig(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateConfig = useCallback(async (newConfig: SiteConfig) => {
    const result = validateConfig(newConfig);
    if (!result.success) {
      throw new Error(`Invalid config: ${result.errors.join(', ')}`);
    }

    // Try API first
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (res.ok) {
        setConfig(newConfig);
        return;
      }
    } catch {
      // Worker not available
    }

    // Fallback: localStorage
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
    setConfig(newConfig);
  }, []);

  return (
    <SiteConfigContext.Provider value={{ config, isLoading, error, updateConfig, reload: loadConfig }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) throw new Error('useSiteConfig must be used within SiteConfigProvider');
  return ctx;
}

export { createDefaultConfig };
