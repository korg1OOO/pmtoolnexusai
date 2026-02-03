import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  id: string | null;
  name: string;
  code: string;
  methodology: Methodology;
  modules: ModuleVisibility;
  defaultView: string;
}

export type GlobalPanelType = 'chat' | 'ai' | 'settings' | null;

interface ProjectContextType {
  settings: ProjectSettings;
  updateMethodology: (methodology: Methodology) => void;
  updateModuleVisibility: (module: keyof ModuleVisibility, visible: boolean) => void;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
  isModuleVisible: (module: keyof ModuleVisibility) => boolean;
  getDefaultModules: (methodology: Methodology) => ModuleVisibility;
  loading: boolean;
  selectProject: (projectId: string) => void;
  activeGlobalPanel: GlobalPanelType;
  setActiveGlobalPanel: (panel: GlobalPanelType) => void;
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
  id: null,
  name: 'No Project Selected',
  code: '',
  methodology: 'hybrid',
  modules: { ...defaultModules },
  defaultView: 'dashboard',
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const STORAGE_KEY = 'projectoye-settings';
const SELECTED_PROJECT_KEY = 'projectoye-selected-project';

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ProjectSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [activeGlobalPanel, setActiveGlobalPanel] = useState<GlobalPanelType>(null);

  // Load selected project on mount
  useEffect(() => {
    const loadProject = async () => {
      console.log('[ProjectContext] Starting to load project...');
      try {
        // First try to get stored project ID
        const storedProjectId = localStorage.getItem(SELECTED_PROJECT_KEY);
        console.log('[ProjectContext] Stored project ID:', storedProjectId);

        // Get the first available project or the stored one
        let query = supabase.from('projects').select('*');

        if (storedProjectId) {
          // Try to load the stored project first
          const { data: storedProject } = await supabase
            .from('projects')
            .select('*')
            .eq('id', storedProjectId)
            .maybeSingle();

          console.log('[ProjectContext] Stored project query result:', storedProject);

          if (storedProject) {
            const methodology = (storedProject.methodology || 'hybrid') as Methodology;
            setSettings({
              id: storedProject.id,
              name: storedProject.name,
              code: storedProject.code,
              methodology,
              modules: getDefaultModulesInternal(methodology),
              defaultView: methodology === 'waterfall' ? 'gantt' : methodology === 'scrum' ? 'sprints' : 'dashboard',
            });
            setLoading(false);
            console.log('[ProjectContext] Loaded stored project successfully');
            return;
          }
        }

        // Fall back to first available project
        const { data: projects } = await query.order('created_at', { ascending: false }).limit(1);
        console.log('[ProjectContext] First available project query result:', projects);

        if (projects && projects.length > 0) {
          const project = projects[0];
          const methodology = (project.methodology || 'hybrid') as Methodology;
          localStorage.setItem(SELECTED_PROJECT_KEY, project.id);
          setSettings({
            id: project.id,
            name: project.name,
            code: project.code,
            methodology,
            modules: getDefaultModulesInternal(methodology),
            defaultView: methodology === 'waterfall' ? 'gantt' : methodology === 'scrum' ? 'sprints' : 'dashboard',
          });
          console.log('[ProjectContext] Loaded first available project');
        } else {
          console.log('[ProjectContext] No projects found in database');
        }
      } catch (error) {
        console.error('[ProjectContext] Failed to load project:', error);
      } finally {
        setLoading(false);
        console.log('[ProjectContext] Loading complete');
      }
    };

    loadProject();
  }, []);

  const getDefaultModulesInternal = (methodology: Methodology): ModuleVisibility => {
    return {
      ...defaultModules,
      ...methodologyDefaults[methodology],
    };
  };

  const getDefaultModules = (methodology: Methodology): ModuleVisibility => {
    return getDefaultModulesInternal(methodology);
  };

  const selectProject = async (projectId: string) => {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      const methodology = (project.methodology || 'hybrid') as Methodology;
      localStorage.setItem(SELECTED_PROJECT_KEY, project.id);
      setSettings({
        id: project.id,
        name: project.name,
        code: project.code,
        methodology,
        modules: getDefaultModulesInternal(methodology),
        defaultView: methodology === 'waterfall' ? 'gantt' : methodology === 'scrum' ? 'sprints' : 'dashboard',
      });
    } catch (error) {
      console.error('Failed to select project:', error);
    }
  };

  const updateMethodology = (methodology: Methodology) => {
    const newModules = getDefaultModulesInternal(methodology);
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
        loading,
        selectProject,
        activeGlobalPanel,
        setActiveGlobalPanel,
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
