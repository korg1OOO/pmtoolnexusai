import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { usePresence, PresenceUser } from '@/hooks/usePresence';

interface PresenceContextValue {
  users: PresenceUser[];
  startEditing: (taskId?: string) => void;
  stopEditing: () => void;
  updateCursor: (position: { x: number; y: number }) => Promise<void>;
  isConnected: boolean;
  setCurrentProjectId: (projectId: string | null) => void;
}

const PresenceContext = createContext<PresenceContextValue | undefined>(undefined);

interface PresenceProviderProps {
  children: ReactNode;
}

export function PresenceProvider({ children }: PresenceProviderProps) {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const presence = usePresence(currentProjectId);

  const contextValue: PresenceContextValue = {
    ...presence,
    setCurrentProjectId,
  };

  return (
    <PresenceContext.Provider value={contextValue}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresenceContext() {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresenceContext must be used within a PresenceProvider');
  }
  return context;
}
