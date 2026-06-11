import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Plus, Target, Users } from 'lucide-react';
import { 
  MegaProject, 
  ProjectNode, 
  Task, 
  calculateNodeProgress, 
  getProgressColor,
  getWaveColor 
} from '@/types/project-hierarchy';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CreateNodeDialog } from './CreateNodeDialog';
import { CreateTaskDialog } from './CreateTaskDialog';
import { ColorWave } from './ColorWave';

// ==================== MOCK DATA ====================
const mockMegaProject: MegaProject = {
  id: 'mega-1',
  name: 'NexusAI Platform v2',
  description: 'Complete rebuild of the PM platform with mind-map core',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-06-10T00:00:00Z',
  children: [
    {
      id: 'mod-1',
      name: 'Core Architecture',
      type: 'module',
      description: 'Main system architecture and foundations',
      children: [
        {
          id: 'sub-1-1',
          name: 'Database Layer',
          type: 'submodule',
          children: [],
          tasks: [
            {
              id: 't1',
              name: 'Design Supabase schema',
              assignee: 'Enzo',
              deadline: '2026-06-15',
              status: 'In Progress',
              priority: 'High',
              progress: 65,
              createdAt: '2026-06-01',
              completedAt: null,
            },
          ],
        },
      ],
      tasks: [],
    },
    {
      id: 'mod-2',
      name: 'Frontend Experience',
      type: 'module',
      children: [],
      tasks: [],
    },
  ],
};

// ==================== NODE CARD ====================
interface ProjectNodeCardProps {
  node: ProjectNode;
  level: number;
  onAddChild: (parentId: string, type: 'module' | 'submodule') => void;
  onAddTask: (nodeId: string) => void;
}

const ProjectNodeCard: React.FC<ProjectNodeCardProps> = ({ 
  node, 
  level, 
  onAddChild, 
  onAddTask 
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const progress = calculateNodeProgress(node);
  const waveColor = getWaveColor(progress);

  return (
    <div className={cn("ml-4", level > 0 && "border-l border-border/60 pl-4")}>
      <motion.div
        whileHover={{ scale: 1.005 }}
        className="group relative mb-3 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md"
      >
        <ColorWave color={waveColor} intensity={progress > 75 ? 'low' : progress < 40 ? 'high' : 'medium'} />

        <div className="relative flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg tracking-tight">{node.name}</span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {node.type}
                  </span>
                </div>
                {node.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{node.description}</p>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 max-w-[220px]">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium tabular-nums">{progress}%</span>
                </div>
                <Progress 
                  value={progress} 
                  className={cn(
                    "h-2",
                    getProgressColor(progress) === 'red' && "[&>div]:bg-red-500",
                    getProgressColor(progress) === 'orange' && "[&>div]:bg-orange-500",
                    getProgressColor(progress) === 'yellow' && "[&>div]:bg-yellow-500",
                    getProgressColor(progress) === 'green' && "[&>div]:bg-green-500"
                  )} 
                />
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Target className="h-4 w-4" />
                  <span>{node.tasks.length} tasks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>{node.children.length} children</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onAddChild(node.id, 'submodule')}
              className="h-8 px-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Sub
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onAddTask(node.id)}
              className="h-8 px-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Task
            </Button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <ProjectNodeCard 
                key={child.id} 
                node={child} 
                level={level + 1}
                onAddChild={onAddChild}
                onAddTask={onAddTask}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
export const ProjectMindMap: React.FC = () => {
  const [megaProject, setMegaProject] = useState<MegaProject>(mockMegaProject);

  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [selectedNodeType, setSelectedNodeType] = useState<'module' | 'submodule'>('submodule');

  const overallProgress = calculateMegaProjectProgress(megaProject);

  const addNodeToTree = (nodes: ProjectNode[], parentId: string, newNode: ProjectNode): ProjectNode[] => {
    return nodes.map(node => {
      if (node.id === parentId) {
        return { ...node, children: [...node.children, newNode] };
      }
      if (node.children.length > 0) {
        return { ...node, children: addNodeToTree(node.children, parentId, newNode) };
      }
      return node;
    });
  };

  const addTaskToNode = (nodes: ProjectNode[], nodeId: string, newTask: Task): ProjectNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, tasks: [...node.tasks, newTask] };
      }
      if (node.children.length > 0) {
        return { ...node, children: addTaskToNode(node.children, nodeId, newTask) };
      }
      return node;
    });
  };

  const handleAddChildClick = (parentId: string, type: 'module' | 'submodule') => {
    setSelectedParentId(parentId);
    setSelectedNodeType(type);
    setNodeDialogOpen(true);
  };

  const handleAddTaskClick = (nodeId: string) => {
    setSelectedParentId(nodeId);
    setTaskDialogOpen(true);
  };

  const handleCreateNode = (name: string, description: string) => {
    const newNode: ProjectNode = {
      id: `node-${Date.now()}`,
      name,
      description: description || undefined,
      type: selectedNodeType,
      children: [],
      tasks: [],
    };
    setMegaProject(prev => ({
      ...prev,
      children: addNodeToTree(prev.children, selectedParentId, newNode),
    }));
  };

  const handleCreateTask = (taskData: any) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      ...taskData,
      status: 'Not Started',
      progress: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    setMegaProject(prev => ({
      ...prev,
      children: addTaskToNode(prev.children, selectedParentId, newTask),
    }));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4 bg-background/95 backdrop-blur">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{megaProject.name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{megaProject.description}</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">OVERALL PROGRESS</div>
            <div className="text-3xl font-semibold tabular-nums tracking-tighter">{overallProgress}%</div>
          </div>
          <Button onClick={() => handleAddChildClick(megaProject.id, 'module')} className="gap-2">
            <Plus className="h-4 w-4" /> Add Module
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-muted/30">
        <div className="max-w-[1100px] mx-auto">
          {megaProject.children.map((node) => (
            <ProjectNodeCard 
              key={node.id} 
              node={node} 
              level={0}
              onAddChild={handleAddChildClick}
              onAddTask={handleAddTaskClick}
            />
          ))}
        </div>
      </div>

      <CreateNodeDialog 
        open={nodeDialogOpen} 
        onOpenChange={setNodeDialogOpen} 
        nodeType={selectedNodeType} 
        onCreate={handleCreateNode} 
      />
      <CreateTaskDialog 
        open={taskDialogOpen} 
        onOpenChange={setTaskDialogOpen} 
        onCreate={handleCreateTask} 
      />
    </div>
  );
};