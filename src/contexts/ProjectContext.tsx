import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Methodology = 'waterfall' | 'scrum' | 'kanban' | 'hybrid';

export interface ModuleVisibility {
  // Planning
  projectPlan: boolean;
  childPlans: boolean;
  gantt: boolean;
  childGantt: boolean;
  milestones: boolean;
  programTimeline: boolean;
  // Execution
  sprints: boolean;
  backlog: boolean;
  actions: boolean;
  issues: boolean;
  // Core
  dashboard: boolean;
  executiveDashboard: boolean;
  strategic: boolean;
  portfolio: boolean;
  traceability: boolean;
  meetings: boolean;
  communications: boolean;
  resources: boolean;
  risks: boolean;
  decisions: boolean;
  financials: boolean;
  notes: boolean;
  reports: boolean;
  presentations: boolean;
}

export interface ProjectSettings {
  id: string;
  name: string;
  code: string;
  methodology: Methodology;
  modules: ModuleVisibility;
  defaultView: string;
}

interface ProjectContextType {
  settings: ProjectSettings;
  updateMethodology: (methodology: Methodology) => void;
  updateModuleVisibility: (module: keyof ModuleVisibility, visible: boolean) => void;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
  isModuleVisible: (module: keyof ModuleVisibility) => boolean;
  getDefaultModules: (methodology: Methodology) => ModuleVisibility;
}

const defaultModules: ModuleVisibility = {
  projectPlan: true,
  childPlans: true,
  gantt: true,
  childGantt: true,
  milestones: true,
  programTimeline: true,
  sprints: true,
  backlog: true,
  actions: true,
  issues: true,
  dashboard: true,
  executiveDashboard: true,
  strategic: true,
  portfolio: true,
  traceability: true,
  meetings: true,
  communications: true,
  resources: true,
  risks: true,
  decisions: true,
  financials: true,
  notes: true,
  reports: true,
  presentations: true,
};

const methodologyDefaults: Record<Methodology, Partial<ModuleVisibility>> = {
  waterfall: {
    sprints: false,
    backlog: false,
    gantt: true,
    projectPlan: true,
    milestones: true,
  },
  scrum: {
    sprints: true,
    backlog: true,
    gantt: false,
    projectPlan: true,
    milestones: true,
  },
  kanban: {
    sprints: false,
    backlog: true,
    gantt: false,
    projectPlan: true,
    milestones: false,
  },
  hybrid: {
    sprints: true,
    backlog: true,
    gantt: true,
    projectPlan: true,
    milestones: true,
  },
};

const defaultSettings: ProjectSettings = {
  id: 'proj-001',
  name: 'Enterprise Platform Migration',
  code: 'EPM-2024',
  methodology: 'hybrid',
  modules: { ...defaultModules },
  defaultView: 'dashboard',
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const STORAGE_KEY = 'projectiq-settings';

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ProjectSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load project settings:', e);
    }
    return defaultSettings;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save project settings:', e);
    }
  }, [settings]);

  const getDefaultModules = (methodology: Methodology): ModuleVisibility => {
    return {
      ...defaultModules,
      ...methodologyDefaults[methodology],
    };
  };

  const updateMethodology = (methodology: Methodology) => {
    const newModules = getDefaultModules(methodology);
    setSettings((prev) => ({
      ...prev,
      methodology,
      modules: newModules,
      defaultView: methodology === 'waterfall' ? 'gantt' : methodology === 'scrum' ? 'sprints' : 'dashboard',
    }));
  };

  const updateModuleVisibility = (module: keyof ModuleVisibility, visible: boolean) => {
    setSettings((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [module]: visible,
      },
    }));
  };

  const updateSettings = (newSettings: Partial<ProjectSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  const isModuleVisible = (module: keyof ModuleVisibility): boolean => {
    return settings.modules[module] ?? true;
  };

  return (
    <ProjectContext.Provider
      value={{
        settings,
        updateMethodology,
        updateModuleVisibility,
        updateSettings,
        isModuleVisible,
        getDefaultModules,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
}
