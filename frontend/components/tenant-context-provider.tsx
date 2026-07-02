'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  TenantContext,
  fetchTenantContext,
  fetchTenantContextByHost,
  applyTenantThemeToCSS,
  applyTenantFavicon,
} from '@/lib/tenant-context';

interface TenantContextValue {
  tenant: TenantContext | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const TenantContextCtx = createContext<TenantContextValue>({
  tenant: null,
  loading: true,
  error: null,
  refetch: () => {},
});

export function useTenantContext(): TenantContextValue {
  return useContext(TenantContextCtx);
}

export function useTenant(): TenantContext | null {
  return useContext(TenantContextCtx).tenant;
}

interface TenantContextProviderProps {
  slug?: string;
  children: React.ReactNode;
}

export function TenantContextProvider({ slug, children }: TenantContextProviderProps) {
  const [tenant, setTenant] = useState<TenantContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let ctx: TenantContext | null = null;

      if (slug) {
        ctx = await fetchTenantContext(slug);
      } else {
        // Try to resolve from host (subdomain or custom domain)
        ctx = await fetchTenantContextByHost();
      }

      if (ctx) {
        setTenant(ctx);
        applyTenantThemeToCSS(ctx.theme);
        applyTenantFavicon(ctx.theme.favicon_url);
      } else {
        setTenant(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenant context');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <TenantContextCtx.Provider value={{ tenant, loading, error, refetch: load }}>
      {children}
    </TenantContextCtx.Provider>
  );
}
