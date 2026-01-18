import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen,
  FileText,
  FolderOpen,
  Plus,
  Search,
  Tag,
  Link2,
  Share2,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Edit3,
  Trash2,
  Clock,
  User,
  Hash,
  Sparkles,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  CheckSquare,
  Image,
  Table2,
  Code2,
  LinkIcon,
  Target,
} from 'lucide-react';
import { mockNotes } from '@/data/mockData';
import type { Note } from '@/types/project';

interface Notebook {
  id: string;
  name: string;
  icon: React.ElementType;
  sections: Section[];
}

interface Section {
  id: string;
  name: string;
  notes: Note[];
}

const notebooks: Notebook[] = [
  {
    id: 'NB-001',
    name: 'Technical',
    icon: Code2,
    sections: [
      { id: 'SEC-001', name: 'Architecture', notes: mockNotes.filter(n => n.section === 'Architecture') },
      { id: 'SEC-002', name: 'Security', notes: [] },
      { id: 'SEC-003', name: 'Infrastructure', notes: [] },
    ],
  },
  {
    id: 'NB-002',
    name: 'Agile',
    icon: ListOrdered,
    sections: [
      { id: 'SEC-004', name: 'Retrospectives', notes: mockNotes.filter(n => n.section === 'Retrospectives') },
      { id: 'SEC-005', name: 'Planning', notes: [] },
    ],
  },
  {
    id: 'NB-003',
    name: 'Meetings',
    icon: BookOpen,
    sections: [
      { id: 'SEC-006', name: 'Steering Committee', notes: [] },
      { id: 'SEC-007', name: 'Standups', notes: [] },
    ],
  },
];

const allTags = ['#decision', '#architecture', '#aws', '#retro', '#sprint12', '#risk', '#todo', '#important'];

export function NotesView() {
  const [selectedNotebook, setSelectedNotebook] = useState<string>('NB-001');
  const [selectedSection, setSelectedSection] = useState<string>('SEC-001');
  const [selectedNote, setSelectedNote] = useState<Note | null>(mockNotes[0] || null);
  const [expandedNotebooks, setExpandedNotebooks] = useState<string[]>(['NB-001', 'NB-002']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const toggleNotebook = (id: string) => {
    setExpandedNotebooks(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  const currentNotebook = notebooks.find(nb => nb.id === selectedNotebook);
  const currentSection = currentNotebook?.sections.find(s => s.id === selectedSection);
  const sectionNotes = currentSection?.notes || [];

  return (
    <div className="h-full flex">
      {/* Notebooks Panel - Left */}
      <div className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Knowledge Base
          </h2>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {notebooks.map(notebook => {
              const Icon = notebook.icon;
              const isExpanded = expandedNotebooks.includes(notebook.id);
              
              return (
                <div key={notebook.id}>
                  <button
                    onClick={() => toggleNotebook(notebook.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                      'hover:bg-accent transition-colors',
                      selectedNotebook === notebook.id && 'bg-accent'
                    )}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium">{notebook.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {notebook.sections.reduce((acc, s) => acc + s.notes.length, 0)}
                    </span>
                  </button>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-4 pl-3 border-l border-border mt-1 space-y-1"
                      >
                        {notebook.sections.map(section => (
                          <button
                            key={section.id}
                            onClick={() => {
                              setSelectedNotebook(notebook.id);
                              setSelectedSection(section.id);
                            }}
                            className={cn(
                              'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm',
                              'hover:bg-accent/50 transition-colors',
                              selectedSection === section.id && 'bg-accent text-accent-foreground'
                            )}
                          >
                            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{section.name}</span>
                            {section.notes.length > 0 && (
                              <span className="ml-auto text-xs text-muted-foreground">
                                {section.notes.length}
                              </span>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t border-border">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            New Notebook
          </Button>
        </div>
      </div>

      {/* Notes List - Middle */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">{currentSection?.name || 'Notes'}</h3>
            <Button variant="ghost" size="iconSm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sectionNotes.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No notes in this section</p>
                <Button variant="link" size="sm" className="mt-2">
                  Create your first note
                </Button>
              </div>
            ) : (
              sectionNotes.map(note => (
                <motion.button
                  key={note.id}
                  whileHover={{ x: 2 }}
                  onClick={() => setSelectedNote(note)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border border-transparent',
                    'hover:bg-accent/50 transition-all',
                    selectedNote?.id === note.id && 'bg-accent border-border'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm text-foreground truncate">
                      {note.title}
                    </h4>
                    {note.isShared && (
                      <Share2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {note.content.slice(0, 100)}...
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {note.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{note.tags.length - 2}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {note.createdBy.split(' ')[0]}
                    </span>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Note Editor - Right */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedNote ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="iconSm">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="iconSm">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="iconSm">
                  <Underline className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button variant="ghost" size="iconSm">
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="iconSm">
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="iconSm">
                  <CheckSquare className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button variant="ghost" size="iconSm">
                  <Table2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="iconSm">
                  <Image className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="iconSm">
                  <Code2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="iconSm">
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Assist
                </Button>
                <Button variant="ghost" size="iconSm">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="iconSm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Editor Content */}
            <ScrollArea className="flex-1">
              <div className="max-w-4xl mx-auto p-8">
                <input
                  type="text"
                  value={selectedNote.title}
                  className="w-full text-3xl font-bold bg-transparent border-none outline-none text-foreground mb-4 placeholder:text-muted-foreground"
                  placeholder="Untitled Note"
                />
                
                {/* Tags */}
                <div className="flex items-center gap-2 mb-6">
                  {selectedNote.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      <Hash className="h-3 w-3" />
                      {tag.replace('#', '')}
                    </Badge>
                  ))}
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add tag
                  </Button>
                </div>
                
                {/* Content */}
                <div className="prose prose-invert max-w-none">
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    className="min-h-[400px] focus:outline-none text-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: selectedNote.content
                        .replace(/^# (.*)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-foreground">$1</h1>')
                        .replace(/^## (.*)/gm, '<h2 class="text-xl font-semibold mt-5 mb-3 text-foreground">$1</h2>')
                        .replace(/^### (.*)/gm, '<h3 class="text-lg font-medium mt-4 mb-2 text-foreground">$1</h3>')
                        .replace(/^- (.*)/gm, '<li class="text-muted-foreground ml-4">$1</li>')
                        .replace(/\n/g, '<br />')
                    }}
                  />
                </div>
                
                {/* Linked Items */}
                {selectedNote.linkedItems.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Linked Items
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNote.linkedItems.map(item => (
                        <Badge key={item.id} variant="outline" className="gap-1.5 cursor-pointer hover:bg-accent">
                          {item.type === 'decision' && <Target className="h-3 w-3 text-primary" />}
                          {item.type === 'task' && <CheckSquare className="h-3 w-3 text-success" />}
                          {item.type === 'risk' && <Tag className="h-3 w-3 text-warning" />}
                          {item.title}
                        </Badge>
                      ))}
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Link item
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Footer */}
            <div className="px-8 py-3 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>Created by {selectedNote.createdBy}</span>
                <span>·</span>
                <span>Last updated {new Date(selectedNote.updatedAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedNote.isShared && (
                  <Badge variant="outline" className="text-xs">
                    <Share2 className="h-3 w-3 mr-1" />
                    Shared
                  </Badge>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p>Select a note to view or edit</p>
              <Button variant="link" className="mt-2">
                Or create a new note
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* AI Panel - Far Right */}
      <div className="w-72 border-l border-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Assistant
          </h3>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Quick Actions</h4>
                <div className="space-y-2">
                  {['Summarize note', 'Extract action items', 'Find related decisions', 'Generate questions'].map(action => (
                    <Button key={action} variant="ghost" size="sm" className="w-full justify-start text-xs">
                      <Sparkles className="h-3 w-3 mr-2 text-primary" />
                      {action}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Suggested Tags</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex flex-wrap gap-1.5">
                  {allTags.slice(0, 5).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs cursor-pointer hover:bg-primary/20">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Related Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-2">
                {mockNotes.slice(0, 3).map(note => (
                  <button
                    key={note.id}
                    className="w-full text-left p-2 rounded-md hover:bg-accent text-sm"
                  >
                    <p className="font-medium text-foreground truncate">{note.title}</p>
                    <p className="text-xs text-muted-foreground">85% match</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
