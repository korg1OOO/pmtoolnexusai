import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2, Plus, Search, FolderKanban, MoreVertical, Loader2, Archive, ArchiveRestore } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectContext } from '@/contexts/ProjectContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function ProjectsListView() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [projectToDelete, setProjectToDelete] = useState<{ id: string, name: string } | null>(null);
  const [projectToArchive, setProjectToArchive] = useState<{ id: string, name: string, isArchiving: boolean } | null>(null);
  const { selectProject, clearProject, settings } = useProjectContext();

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load projects');
    } else {
      setProjects((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    const { error } = await supabase.from('projects').delete().eq('id', projectToDelete.id);
    if (error) {
      toast.error('Failed to delete project: ' + error.message);
    } else {
      toast.success('Project deleted successfully');
      // If the deleted project was the currently active one, clear context state
      if (projectToDelete.id === settings.id) {
        clearProject();
      }
      fetchProjects();
    }
    setProjectToDelete(null);
  };

  const confirmArchive = async () => {
    if (!projectToArchive) return;

    const { id, isArchiving } = projectToArchive;
    const newStatus = isArchiving ? 'archived' : 'active';
    const actionText = isArchiving ? 'archive' : 'restore';

    const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', id);
    if (error) {
      toast.error(`Failed to ${actionText} project: ` + error.message);
    } else {
      toast.success(`Project ${isArchiving ? 'archived' : 'restored'} successfully`);
      fetchProjects();
    }
    setProjectToArchive(null);
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
  );

  const activeProjects = filteredProjects.filter(p => p.status !== 'archived');
  const archivedProjects = filteredProjects.filter(p => p.status === 'archived');

  const currentProjects = activeTab === 'active' ? activeProjects : archivedProjects;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor all your projects in one place.</p>
        </div>
        <Button onClick={() => navigate('/create-project')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="w-[400px] grid grid-cols-2">
            <TabsTrigger value="active">Active Projects</TabsTrigger>
            <TabsTrigger value="archived">Archived Projects</TabsTrigger>
          </TabsList>
          <div className="relative w-64 block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <TabsContent value="active" className="mt-0">
          <Card className="shadow-sm border-border">
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : currentProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <FolderKanban className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">No projects found in this view</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    {activeTab === 'active'
                      ? 'Get started by creating your first project, or try adjusting your search terms.'
                      : 'You have no archived projects matching your search.'}
                  </p>
                  {activeTab === 'active' && (
                    <Button onClick={() => navigate('/create-project')} className="mt-4" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Project
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Match</TableHead>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentProjects.map((project) => (
                        <TableRow key={project.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            <Badge variant="outline" className="font-mono text-xs">{project.code || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground cursor-pointer hover:underline" onClick={() => {
                                selectProject(project.id);
                                navigate('/dashboard');
                              }}>
                                {project.name}
                              </span>
                              <span className="text-xs text-muted-foreground line-clamp-1 max-w-[300px] mt-0.5">
                                {project.description || 'No description provided'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              project.status === 'archived' ? 'secondary' :
                                project.status === 'active' || project.status === 'in-progress' ? 'default' :
                                  project.status === 'completed' ? 'success' :
                                    project.status === 'on-hold' ? 'warning' : 'secondary'
                            }>
                              {project.status === 'archived' ? 'Archived' : (project.status || 'Draft')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              project.priority === 'high' || project.priority === 'critical' ? 'text-destructive border-destructive/50 bg-destructive/10' :
                                project.priority === 'medium' ? 'text-warning border-warning/50 bg-warning/10' : ''
                            }>
                              {project.priority || 'Medium'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(project.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  selectProject(project.id);
                                  navigate('/dashboard');
                                }}>
                                  <FolderKanban className="h-4 w-4 mr-2" />
                                  Open Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  localStorage.setItem('projectoye_selected_project', project.id);
                                  navigate('/admin/project');
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {project.status !== 'archived' ? (
                                  <DropdownMenuItem
                                    onClick={() => setProjectToArchive({ id: project.id, name: project.name, isArchiving: true })}
                                  >
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive Project
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => setProjectToArchive({ id: project.id, name: project.name, isArchiving: false })}
                                  >
                                    <ArchiveRestore className="h-4 w-4 mr-2" />
                                    Restore Project
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setProjectToDelete({ id: project.id, name: project.name })}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Project
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived" className="mt-0">
          <Card className="shadow-sm border-border">
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : currentProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Archive className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">No archived projects</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Projects you archive will securely appear here. They are hidden from the main dashboard but never deleted.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Match</TableHead>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentProjects.map((project) => (
                        <TableRow key={project.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            <Badge variant="outline" className="font-mono text-xs">{project.code || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground cursor-pointer hover:underline" onClick={() => {
                                selectProject(project.id);
                                navigate('/dashboard');
                              }}>
                                {project.name}
                              </span>
                              <span className="text-xs text-muted-foreground line-clamp-1 max-w-[300px] mt-0.5">
                                {project.description || 'No description provided'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              Archived
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              project.priority === 'high' || project.priority === 'critical' ? 'text-destructive border-destructive/50 bg-destructive/10' :
                                project.priority === 'medium' ? 'text-warning border-warning/50 bg-warning/10' : ''
                            }>
                              {project.priority || 'Medium'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(project.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  selectProject(project.id);
                                  navigate('/dashboard');
                                }}>
                                  <FolderKanban className="h-4 w-4 mr-2" />
                                  Open Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  localStorage.setItem('projectoye_selected_project', project.id);
                                  navigate('/admin/project');
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setProjectToArchive({ id: project.id, name: project.name, isArchiving: false })}
                                >
                                  <ArchiveRestore className="h-4 w-4 mr-2" />
                                  Restore Project
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setProjectToDelete({ id: project.id, name: project.name })}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Project
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project <strong>"{projectToDelete?.name}"</strong> and all of its associated data, including tasks, risks, and financial records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!projectToArchive} onOpenChange={(open) => !open && setProjectToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {projectToArchive?.isArchiving ? 'Archive Project?' : 'Restore Project?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {projectToArchive?.isArchiving
                ? `Are you sure you want to archive "${projectToArchive?.name}"? It will be hidden from the active dashboard and moved to the Archived Workspace.`
                : `Are you sure you want to restore "${projectToArchive?.name}"? It will become active and visible on the main dashboard again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive} className={projectToArchive?.isArchiving ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}>
              {projectToArchive?.isArchiving ? 'Archive Project' : 'Restore Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
