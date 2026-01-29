import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  BookOpen,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderOpen,
  Palette,
  Code2,
  FileText,
  Briefcase,
  Users,
  Target,
  Lightbulb,
} from 'lucide-react';
import type { Notebook, NotebookSection } from '@/hooks/useNotebooks';

const iconMap: Record<string, React.ElementType> = {
  'book-open': BookOpen,
  'code': Code2,
  'file-text': FileText,
  'briefcase': Briefcase,
  'users': Users,
  'target': Target,
  'lightbulb': Lightbulb,
};

const colorMap: Record<string, string> = {
  blue: 'text-blue-500',
  green: 'text-green-500',
  purple: 'text-purple-500',
  orange: 'text-orange-500',
  red: 'text-red-500',
  yellow: 'text-yellow-500',
  pink: 'text-pink-500',
  cyan: 'text-cyan-500',
};

interface NotebookSidebarProps {
  notebooks: Notebook[];
  sections: NotebookSection[];
  selectedNotebookId: string | null;
  selectedSectionId: string | null;
  onSelectNotebook: (id: string) => void;
  onSelectSection: (id: string) => void;
  onCreateNotebook: (name: string, icon: string, color: string) => Promise<Notebook | null>;
  onUpdateNotebook: (id: string, updates: Partial<Notebook>) => void;
  onDeleteNotebook: (id: string) => void;
  onCreateSection: (name: string) => Promise<NotebookSection | null>;
  onUpdateSection: (id: string, updates: Partial<NotebookSection>) => void;
  onDeleteSection: (id: string) => void;
  totalPages: number;
}

export function NotebookSidebar({
  notebooks,
  sections,
  selectedNotebookId,
  selectedSectionId,
  onSelectNotebook,
  onSelectSection,
  onCreateNotebook,
  onUpdateNotebook,
  onDeleteNotebook,
  onCreateSection,
  onUpdateSection,
  onDeleteSection,
  totalPages,
}: NotebookSidebarProps) {
  const [expandedNotebooks, setExpandedNotebooks] = useState<string[]>([]);
  const [showNewNotebook, setShowNewNotebook] = useState(false);
  const [showNewSection, setShowNewSection] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [newNotebookIcon, setNewNotebookIcon] = useState('book-open');
  const [newNotebookColor, setNewNotebookColor] = useState('blue');
  const [newSectionName, setNewSectionName] = useState('');
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [editingSection, setEditingSection] = useState<NotebookSection | null>(null);

  const toggleNotebook = (id: string) => {
    setExpandedNotebooks(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  const handleCreateNotebook = async () => {
    if (!newNotebookName.trim()) return;
    const notebook = await onCreateNotebook(newNotebookName, newNotebookIcon, newNotebookColor);
    if (notebook) {
      setNewNotebookName('');
      setShowNewNotebook(false);
      setExpandedNotebooks(prev => [...prev, notebook.id]);
      onSelectNotebook(notebook.id);
    }
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return;
    const section = await onCreateSection(newSectionName);
    if (section) {
      setNewSectionName('');
      setShowNewSection(false);
      onSelectSection(section.id);
    }
  };

  const notebookSections = sections.filter(s => 
    notebooks.find(n => n.id === selectedNotebookId)?.id === 
    sections.find(sec => sec.id === s.id)?.notebook_id
  );

  return (
    <div className="w-64 border-r border-border bg-sidebar flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Knowledge Base
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {notebooks.length} notebooks • {totalPages} pages
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {notebooks.map(notebook => {
            const Icon = iconMap[notebook.icon] || BookOpen;
            const isExpanded = expandedNotebooks.includes(notebook.id);
            const notebookSections = sections.filter(s => s.notebook_id === notebook.id);

            return (
              <div key={notebook.id}>
                <div className="flex items-center gap-1 group">
                  <button
                    onClick={() => {
                      toggleNotebook(notebook.id);
                      onSelectNotebook(notebook.id);
                    }}
                    className={cn(
                      'flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                      'hover:bg-accent transition-colors',
                      selectedNotebookId === notebook.id && 'bg-accent'
                    )}
                  >
                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </motion.div>
                    <Icon className={cn('h-4 w-4', colorMap[notebook.color] || 'text-primary')} />
                    <span className="font-medium truncate">{notebook.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{notebookSections.length}</span>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        onSelectNotebook(notebook.id);
                        setShowNewSection(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingNotebook(notebook)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDeleteNotebook(notebook.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-4 pl-3 border-l border-border mt-1 space-y-1"
                    >
                      {notebookSections.map(section => (
                        <div key={section.id} className="flex items-center gap-1 group">
                          <button
                            onClick={() => onSelectSection(section.id)}
                            className={cn(
                              'flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-sm',
                              'hover:bg-accent/50 transition-colors',
                              selectedSectionId === section.id && 'bg-accent text-accent-foreground'
                            )}
                          >
                            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate">{section.name}</span>
                          </button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="iconSm"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingSection(section)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => onDeleteSection(section.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}

                      {notebookSections.length === 0 && (
                        <p className="text-xs text-muted-foreground px-2 py-1">
                          No sections yet
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {notebooks.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No notebooks yet</p>
              <Button
                variant="link"
                size="sm"
                className="mt-2"
                onClick={() => setShowNewNotebook(true)}
              >
                Create your first notebook
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setShowNewNotebook(true)}>
          <Plus className="h-4 w-4" />
          New Notebook
        </Button>
      </div>

      {/* New Notebook Dialog */}
      <Dialog open={showNewNotebook} onOpenChange={setShowNewNotebook}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Notebook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
                placeholder="My Notebook"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium">Icon</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {Object.entries(iconMap).map(([key, Icon]) => (
                  <Button
                    key={key}
                    variant={newNotebookIcon === key ? 'default' : 'outline'}
                    size="iconSm"
                    onClick={() => setNewNotebookIcon(key)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {Object.entries(colorMap).map(([key, className]) => (
                  <Button
                    key={key}
                    variant={newNotebookColor === key ? 'default' : 'outline'}
                    size="iconSm"
                    onClick={() => setNewNotebookColor(key)}
                    className={newNotebookColor !== key ? className : ''}
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewNotebook(false)}>Cancel</Button>
            <Button onClick={handleCreateNotebook}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Section Dialog */}
      <Dialog open={showNewSection} onOpenChange={setShowNewSection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Section</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Section Name</label>
            <Input
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="New Section"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSection(false)}>Cancel</Button>
            <Button onClick={handleCreateSection}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Notebook Dialog */}
      <Dialog open={!!editingNotebook} onOpenChange={() => setEditingNotebook(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Notebook</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editingNotebook?.name || ''}
              onChange={(e) => setEditingNotebook(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder="Notebook name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNotebook(null)}>Cancel</Button>
            <Button onClick={() => {
              if (editingNotebook) {
                onUpdateNotebook(editingNotebook.id, { name: editingNotebook.name });
                setEditingNotebook(null);
              }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={!!editingSection} onOpenChange={() => setEditingSection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Section</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editingSection?.name || ''}
              onChange={(e) => setEditingSection(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder="Section name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
            <Button onClick={() => {
              if (editingSection) {
                onUpdateSection(editingSection.id, { name: editingSection.name });
                setEditingSection(null);
              }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
