import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2, Plus, Search, FolderKanban, MoreVertical, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load projects');
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete project "${name}"? This cannot be undone.`)) return;
    
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete project: ' + error.message);
    } else {
      toast.success('Project deleted successfully');
      fetchProjects();
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
  );

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

      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-medium">Project Directory</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search projects by name or code..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <FolderKanban className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium">No projects found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Get started by creating your first project, or try adjusting your search terms.
              </p>
              <Button onClick={() => navigate('/create-project')} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create New Project
              </Button>
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
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="font-mono text-xs">{project.code || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground cursor-pointer hover:underline" onClick={() => {
                             localStorage.setItem('projectoye_selected_project', project.id);
                             navigate('/dashboard');
                             window.location.reload();
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
                          project.status === 'active' || project.status === 'in-progress' ? 'default' :
                          project.status === 'completed' ? 'success' :
                          project.status === 'on-hold' ? 'warning' : 'secondary'
                        }>
                          {project.status || 'Draft'}
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
                               localStorage.setItem('projectoye_selected_project', project.id);
                               navigate('/dashboard');
                               window.location.reload();
                            }}>
                              <FolderKanban className="h-4 w-4 mr-2" />
                              Open Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                               localStorage.setItem('projectoye_selected_project', project.id);
                               navigate('/admin/project');
                               window.location.reload();
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(project.id, project.name)}
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
    </div>
  );
}
