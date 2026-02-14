/**
 * TenantContext
 * Provides tenant and workspace context to all child components.
 * Queries user_tenants for the logged-in user and provides tenantId, workspaceId, and role.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface TenantContextType {
  tenantId: string | null;
  tenantName: string | null;
  role: string | null;
  workspaceId: string | null;
  setWorkspaceId: (id: string | null) => void;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  tenantName: null,
  role: null,
  workspaceId: null,
  setWorkspaceId: () => {},
  loading: true,
  error: null,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setTenantId(null);
      setTenantName(null);
      setRole(null);
      setWorkspaceId(null);
      setLoading(false);
      return;
    }

    const fetchTenant = async () => {
      try {
        // Query user_tenants for the logged-in user
        const { data, error: fetchError } = await (supabase as any)
          .from('user_tenants')
          .select('tenant_id, role, tenant_name')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (fetchError) {
          // No tenant found - auto-create one
          if (fetchError.code === 'PGRST116') {
            const newTenant = await autoCreateTenant(user.id, user.email || 'My Organization');
            if (newTenant) {
              setTenantId(newTenant.tenantId);
              setTenantName(newTenant.tenantName);
              setRole('owner');
            }
          } else {
            console.error('Error fetching tenant:', fetchError);
            setError(fetchError.message);
          }
        } else if (data) {
          setTenantId(data.tenant_id);
          setTenantName(data.tenant_name || null);
          setRole(data.role);
        }
      } catch (err) {
        console.error('Tenant context error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [user, authLoading]);

  return (
    <TenantContext.Provider value={{ tenantId, tenantName, role, workspaceId, setWorkspaceId, loading, error }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}

/**
 * Auto-create a tenant and user_tenants record for a new user
 */
async function autoCreateTenant(userId: string, email: string): Promise<{ tenantId: string; tenantName: string } | null> {
  try {
    const tenantName = email.split('@')[0] + "'s Organization";
    const slug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');

    const { data: tenant, error: tenantError } = await (supabase as any)
      .from('tenants')
      .insert({ name: tenantName, slug })
      .select()
      .single();

    if (tenantError) {
      console.error('Failed to create tenant:', tenantError);
      return null;
    }

    // Create user_tenants mapping
    await (supabase as any)
      .from('user_tenants')
      .insert({
        user_id: userId,
        tenant_id: tenant.id,
        role: 'owner',
        tenant_name: tenantName,
      });

    return { tenantId: tenant.id, tenantName };
  } catch (err) {
    console.error('Auto-create tenant failed:', err);
    return null;
  }
}
