import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ArrowUpRight,
  GitBranch,
  Heading1,
  Heading2,
  Quote,
  Strikethrough,
  Highlighter,
  AtSign,
  Network,
} from 'lucide-react';
import type { Note } from '@/types/project';

// Extended note interface with cross-linking support
interface EnhancedNote extends Note {
  backlinks?: { noteId: string; noteTitle: string; context: string }[];
  mentions?: string[];
  wikiLinks?: string[];
}

interface Notebook {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  sections: Section[];
}

interface Section {
  id: string;
  name: string;
  noteIds: string[];
}

// Enhanced mock notes with cross-linking
const enhancedNotes: EnhancedNote[] = [
  {
    id: 'NOTE-001',
    title: 'Architecture Decision Records',
    content: `# ADR-001: Cloud Provider Selection

## Context
We need to select a cloud provider for our [[Enterprise Cloud Migration]] project. This decision impacts all downstream technical choices.

## Decision Drivers
- Cost efficiency for our workload patterns
- Team expertise and learning curve
- Compliance requirements for [[Security Compliance Framework]]
- Integration with existing tools

## Options Considered
1. **AWS** - Market leader, broadest service catalog
2. **Azure** - Strong enterprise integration
3. **GCP** - Best-in-class data/ML capabilities

## Decision
We chose **AWS** as our primary cloud provider because:
- Team has strongest AWS expertise
- Better pricing for our compute-heavy workloads
- Superior container orchestration (EKS)

## Consequences
- Need to establish [[AWS Best Practices]] guidelines
- Training budget allocated for certifications
- See related: [[Infrastructure Setup Guide]]

## Status
Accepted | Date: 2024-03-15 | Decider: @MikeJohnson`,
    notebook: 'Technical',
    section: 'Architecture',
    tags: ['#decision', '#architecture', '#aws', '#adr'],
    createdAt: '2024-03-15T10:30:00Z',
    updatedAt: '2024-03-20T14:00:00Z',
    createdBy: 'Mike Johnson',
    isShared: true,
    linkedItems: [
      { type: 'decision', id: 'DEC-001', title: 'Cloud Provider Selection' },
    ],
    backlinks: [
      { noteId: 'NOTE-003', noteTitle: 'Infrastructure Setup Guide', context: 'Following our [[Architecture Decision Records]], we configure...' },
      { noteId: 'NOTE-004', noteTitle: 'AWS Best Practices', context: 'Based on ADR in [[Architecture Decision Records]]...' },
    ],
    mentions: ['@MikeJohnson'],
    wikiLinks: ['Enterprise Cloud Migration', 'Security Compliance Framework', 'AWS Best Practices', 'Infrastructure Setup Guide'],
  },
  {
    id: 'NOTE-002',
    title: 'Sprint 12 Retrospective Notes',
    content: `# Sprint 12 Retrospective
**Date:** August 2, 2024 | **Facilitator:** @JohnDoe

## Attendees
@JohnDoe @JaneSmith @MikeJohnson @EmilyBrown

## What Went Well 🎉
- Team collaboration improved significantly
- Faster deployments with new CI/CD pipeline
- [[Architecture Decision Records]] process working well
- Story point accuracy at 92%

## What Could Improve 📈
- Documentation updates lagging behind code
- Need better async communication
- [[Technical Debt Backlog]] growing

## Action Items
- [ ] Create documentation sprint - assigned to @JaneSmith
- [ ] Set up async standup bot - assigned to @DavidWilson
- [ ] Review [[Technical Debt Backlog]] - team effort

## Metrics
| Metric | Target | Actual |
|--------|--------|--------|
| Velocity | 32 pts | 34 pts |
| Bug escape rate | <5% | 3% |
| PR review time | <4h | 3.2h |

## Notes
Great sprint overall! See [[Sprint 13 Planning]] for next iteration goals.`,
    notebook: 'Agile',
    section: 'Retrospectives',
    tags: ['#retro', '#sprint12', '#team'],
    createdAt: '2024-08-02T16:00:00Z',
    updatedAt: '2024-08-02T17:30:00Z',
    createdBy: 'John Doe',
    isShared: true,
    linkedItems: [],
    backlinks: [
      { noteId: 'NOTE-005', noteTitle: 'Sprint 13 Planning', context: 'Building on learnings from [[Sprint 12 Retrospective Notes]]...' },
    ],
    mentions: ['@JohnDoe', '@JaneSmith', '@MikeJohnson', '@EmilyBrown', '@DavidWilson'],
    wikiLinks: ['Architecture Decision Records', 'Technical Debt Backlog', 'Sprint 13 Planning'],
  },
  {
    id: 'NOTE-003',
    title: 'Infrastructure Setup Guide',
    content: `# Infrastructure Setup Guide

## Overview
This guide covers the complete infrastructure setup for [[Enterprise Cloud Migration]], following our [[Architecture Decision Records]].

## Prerequisites
- AWS CLI configured
- Terraform >= 1.5.0
- kubectl installed

## Network Architecture
\`\`\`
VPC: 10.0.0.0/16
├── Public Subnet: 10.0.1.0/24
├── Private Subnet: 10.0.2.0/24
└── Database Subnet: 10.0.3.0/24
\`\`\`

## Setup Steps

### 1. Initialize Terraform
\`\`\`bash
cd infrastructure/
terraform init
terraform plan -out=plan.out
\`\`\`

### 2. Deploy Base Infrastructure
See [[Terraform Modules]] for reusable components.

### 3. Configure Kubernetes
Follow [[Kubernetes Setup]] for EKS cluster configuration.

## Security Considerations
- All resources tagged per [[Security Compliance Framework]]
- IAM roles follow least-privilege principle
- See [[AWS Best Practices]] for guidelines

## Troubleshooting
Common issues documented in [[Infrastructure FAQ]].

---
Last updated by @DavidWilson`,
    notebook: 'Technical',
    section: 'Infrastructure',
    tags: ['#infrastructure', '#aws', '#terraform', '#guide'],
    createdAt: '2024-04-10T09:00:00Z',
    updatedAt: '2024-07-15T11:30:00Z',
    createdBy: 'David Wilson',
    isShared: true,
    linkedItems: [
      { type: 'task', id: 'T-010', title: 'Setup AWS Infrastructure' },
    ],
    backlinks: [],
    mentions: ['@DavidWilson'],
    wikiLinks: ['Enterprise Cloud Migration', 'Architecture Decision Records', 'Terraform Modules', 'Kubernetes Setup', 'Security Compliance Framework', 'AWS Best Practices', 'Infrastructure FAQ'],
  },
  {
    id: 'NOTE-004',
    title: 'AWS Best Practices',
    content: `# AWS Best Practices

Based on ADR in [[Architecture Decision Records]], this document outlines our AWS standards.

## Naming Conventions
\`{env}-{project}-{service}-{resource}\`
Example: \`prod-ecm-api-lambda\`

## Tagging Strategy
Required tags for all resources:
- \`Environment\`: dev/staging/prod
- \`Project\`: ECM-2024
- \`Owner\`: Team email
- \`CostCenter\`: Department code

## Security Standards
- No public S3 buckets
- All data encrypted at rest
- VPC endpoints for AWS services
- See [[Security Compliance Framework]]

## Cost Optimization
- Use Savings Plans for predictable workloads
- Implement auto-scaling policies
- Regular rightsizing reviews

## Monitoring
- CloudWatch dashboards per service
- Alerts for all critical metrics
- See [[Monitoring Setup Guide]]`,
    notebook: 'Technical',
    section: 'Architecture',
    tags: ['#aws', '#bestpractices', '#standards'],
    createdAt: '2024-03-20T14:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
    createdBy: 'Mike Johnson',
    isShared: true,
    linkedItems: [],
    backlinks: [
      { noteId: 'NOTE-001', noteTitle: 'Architecture Decision Records', context: 'Need to establish [[AWS Best Practices]] guidelines' },
      { noteId: 'NOTE-003', noteTitle: 'Infrastructure Setup Guide', context: 'See [[AWS Best Practices]] for guidelines' },
    ],
    mentions: [],
    wikiLinks: ['Architecture Decision Records', 'Security Compliance Framework', 'Monitoring Setup Guide'],
  },
  {
    id: 'NOTE-005',
    title: 'Sprint 13 Planning',
    content: `# Sprint 13 Planning
**Sprint Goal:** Complete API Gateway migration

## Capacity
- Team velocity: 34 points (based on [[Sprint 12 Retrospective Notes]])
- Available capacity: 32 points (2 team members on PTO)

## Committed Stories
1. **ECM-201** - API Gateway setup (8 pts)
2. **ECM-202** - Auth integration (5 pts)
3. **ECM-203** - Rate limiting (3 pts)
4. **ECM-204** - Documentation (5 pts)
5. **ECM-205** - Monitoring dashboard (5 pts)

## Dependencies
- [[Infrastructure Setup Guide]] must be complete
- Waiting on security review from @EmilyBrown

## Risks
- Third-party API changes - see [[Risk Register]]
- Team capacity reduced

## Definition of Done
- Code reviewed and merged
- Unit tests passing (>80% coverage)
- Documentation updated
- Deployed to staging`,
    notebook: 'Agile',
    section: 'Planning',
    tags: ['#sprint13', '#planning', '#api'],
    createdAt: '2024-08-05T09:00:00Z',
    updatedAt: '2024-08-05T11:00:00Z',
    createdBy: 'John Doe',
    isShared: true,
    linkedItems: [],
    backlinks: [],
    mentions: ['@EmilyBrown'],
    wikiLinks: ['Sprint 12 Retrospective Notes', 'Infrastructure Setup Guide', 'Risk Register'],
  },
  {
    id: 'NOTE-006',
    title: 'Security Compliance Framework',
    content: `# Security Compliance Framework

## Overview
This framework ensures compliance with SOC2 and GDPR requirements for [[Enterprise Cloud Migration]].

## Key Controls

### Access Management
- MFA required for all users
- Quarterly access reviews
- See [[Access Control Policy]]

### Data Protection
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Data classification: Public/Internal/Confidential/Restricted

### Audit & Monitoring
- All API calls logged to CloudTrail
- 90-day log retention
- Real-time alerting for security events

## Compliance Checklist
- [x] Data inventory complete
- [x] Privacy policy updated
- [ ] Penetration test scheduled
- [ ] SOC2 audit Q4

## Related Documents
- [[Architecture Decision Records]]
- [[AWS Best Practices]]
- [[Incident Response Plan]]`,
    notebook: 'Technical',
    section: 'Security',
    tags: ['#security', '#compliance', '#soc2', '#gdpr'],
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-07-20T15:00:00Z',
    createdBy: 'Emily Brown',
    isShared: true,
    linkedItems: [
      { type: 'risk', id: 'RISK-003', title: 'Compliance Gap' },
    ],
    backlinks: [
      { noteId: 'NOTE-001', noteTitle: 'Architecture Decision Records', context: 'Compliance requirements for [[Security Compliance Framework]]' },
      { noteId: 'NOTE-003', noteTitle: 'Infrastructure Setup Guide', context: 'All resources tagged per [[Security Compliance Framework]]' },
      { noteId: 'NOTE-004', noteTitle: 'AWS Best Practices', context: 'See [[Security Compliance Framework]]' },
    ],
    mentions: [],
    wikiLinks: ['Enterprise Cloud Migration', 'Access Control Policy', 'Architecture Decision Records', 'AWS Best Practices', 'Incident Response Plan'],
  },
];

const notebooks: Notebook[] = [
  {
    id: 'NB-001',
    name: 'Technical',
    icon: Code2,
    color: 'text-blue-500',
    sections: [
      { id: 'SEC-001', name: 'Architecture', noteIds: ['NOTE-001', 'NOTE-004'] },
      { id: 'SEC-002', name: 'Security', noteIds: ['NOTE-006'] },
      { id: 'SEC-003', name: 'Infrastructure', noteIds: ['NOTE-003'] },
    ],
  },
  {
    id: 'NB-002',
    name: 'Agile',
    icon: ListOrdered,
    color: 'text-green-500',
    sections: [
      { id: 'SEC-004', name: 'Retrospectives', noteIds: ['NOTE-002'] },
      { id: 'SEC-005', name: 'Planning', noteIds: ['NOTE-005'] },
    ],
  },
  {
    id: 'NB-003',
    name: 'Meetings',
    icon: BookOpen,
    color: 'text-purple-500',
    sections: [
      { id: 'SEC-006', name: 'Steering Committee', noteIds: [] },
      { id: 'SEC-007', name: 'Standups', noteIds: [] },
    ],
  },
];

const allTags = ['#decision', '#architecture', '#aws', '#retro', '#sprint12', '#risk', '#todo', '#important', '#security', '#infrastructure'];

export function NotesView() {
  const [selectedNotebook, setSelectedNotebook] = useState<string>('NB-001');
  const [selectedSection, setSelectedSection] = useState<string>('SEC-001');
  const [selectedNote, setSelectedNote] = useState<EnhancedNote | null>(enhancedNotes[0]);
  const [expandedNotebooks, setExpandedNotebooks] = useState<string[]>(['NB-001', 'NB-002']);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'ai' | 'links' | 'graph'>('links');
  const [editorContent, setEditorContent] = useState('');

  const toggleNotebook = (id: string) => {
    setExpandedNotebooks(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  const currentNotebook = notebooks.find(nb => nb.id === selectedNotebook);
  const currentSection = currentNotebook?.sections.find(s => s.id === selectedSection);
  const sectionNotes = useMemo(() => {
    return enhancedNotes.filter(n => currentSection?.noteIds.includes(n.id));
  }, [currentSection]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return sectionNotes;
    const query = searchQuery.toLowerCase();
    return sectionNotes.filter(n => 
      n.title.toLowerCase().includes(query) ||
      n.content.toLowerCase().includes(query) ||
      n.tags.some(t => t.toLowerCase().includes(query))
    );
  }, [sectionNotes, searchQuery]);

  // Parse wiki links from content
  const parseWikiLinks = useCallback((content: string) => {
    const wikiLinkRegex = /\[\[(.*?)\]\]/g;
    const links: string[] = [];
    let match;
    while ((match = wikiLinkRegex.exec(content)) !== null) {
      links.push(match[1]);
    }
    return links;
  }, []);

  // Render content with wiki links as clickable
  const renderContent = useCallback((content: string) => {
    return content
      .replace(/\[\[(.*?)\]\]/g, '<span class="text-primary cursor-pointer hover:underline bg-primary/10 px-1 rounded" data-link="$1">[[$1]]</span>')
      .replace(/@(\w+)/g, '<span class="text-blue-400 cursor-pointer hover:underline">@$1</span>')
      .replace(/^# (.*)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-foreground">$1</h1>')
      .replace(/^## (.*)/gm, '<h2 class="text-xl font-semibold mt-5 mb-3 text-foreground">$1</h2>')
      .replace(/^### (.*)/gm, '<h3 class="text-lg font-medium mt-4 mb-2 text-foreground">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg my-4 overflow-x-auto"><code class="text-sm font-mono">$2</code></pre>')
      .replace(/^- \[(x)\] (.*)/gm, '<div class="flex items-center gap-2 my-1"><input type="checkbox" checked class="rounded" /><span class="line-through text-muted-foreground">$2</span></div>')
      .replace(/^- \[ \] (.*)/gm, '<div class="flex items-center gap-2 my-1"><input type="checkbox" class="rounded" /><span>$1</span></div>')
      .replace(/^- (.*)/gm, '<li class="ml-4 list-disc text-muted-foreground">$1</li>')
      .replace(/^\d+\. (.*)/gm, '<li class="ml-4 list-decimal text-muted-foreground">$1</li>')
      .replace(/\n/g, '<br />');
  }, []);

  // Handle clicking on a wiki link
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const link = target.getAttribute('data-link');
    if (link) {
      const linkedNote = enhancedNotes.find(n => n.title === link);
      if (linkedNote) {
        setSelectedNote(linkedNote);
        // Find and select the notebook/section containing this note
        for (const nb of notebooks) {
          for (const sec of nb.sections) {
            if (sec.noteIds.includes(linkedNote.id)) {
              setSelectedNotebook(nb.id);
              setSelectedSection(sec.id);
              break;
            }
          }
        }
      }
    }
  };

  // Graph visualization data
  const graphData = useMemo(() => {
    const nodes = enhancedNotes.map(note => ({
      id: note.id,
      label: note.title,
      group: note.notebook,
    }));
    
    const edges: { from: string; to: string }[] = [];
    enhancedNotes.forEach(note => {
      note.wikiLinks?.forEach(link => {
        const targetNote = enhancedNotes.find(n => n.title === link);
        if (targetNote) {
          edges.push({ from: note.id, to: targetNote.id });
        }
      });
    });
    
    return { nodes, edges };
  }, []);

  return (
    <div className="h-full flex">
      {/* Notebooks Panel - Left */}
      <div className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Knowledge Base
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {enhancedNotes.length} notes • {notebooks.reduce((acc, nb) => acc + nb.sections.length, 0)} sections
          </p>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {notebooks.map(notebook => {
              const Icon = notebook.icon;
              const isExpanded = expandedNotebooks.includes(notebook.id);
              const noteCount = notebook.sections.reduce((acc, s) => acc + s.noteIds.length, 0);
              
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
                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </motion.div>
                    <Icon className={cn('h-4 w-4', notebook.color)} />
                    <span className="font-medium">{notebook.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{noteCount}</span>
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
                            {section.noteIds.length > 0 && (
                              <span className="ml-auto text-xs text-muted-foreground">
                                {section.noteIds.length}
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
        
        <div className="p-3 border-t border-border space-y-2">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            New Notebook
          </Button>
          <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground">
            <Network className="h-4 w-4" />
            View Graph
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
            {filteredNotes.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No notes in this section</p>
                <Button variant="link" size="sm" className="mt-2">
                  Create your first note
                </Button>
              </div>
            ) : (
              filteredNotes.map(note => (
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
                    <div className="flex items-center gap-1">
                      {note.backlinks && note.backlinks.length > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {note.backlinks.length}
                        </Badge>
                      )}
                      {note.isShared && (
                        <Share2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {note.content.replace(/[#*\[\]`]/g, '').slice(0, 100)}...
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
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
                    {note.wikiLinks && note.wikiLinks.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        {note.wikiLinks.length}
                      </span>
                    )}
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Note Editor - Center */}
      <div className="flex-1 flex flex-col bg-background min-w-0">
        {selectedNote ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="iconSm" title="Bold (Ctrl+B)">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="iconSm" title="Italic (Ctrl+I)">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="iconSm">
                  <Strikethrough className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="iconSm">
                  <Highlighter className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button variant="ghost" size="iconSm" title="Heading 1">
                  <Heading1 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="iconSm" title="Heading 2">
                  <Heading2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="iconSm">
                  <Quote className="h-4 w-4" />
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
                  <Code2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="iconSm">
                  <Image className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button 
                  variant="ghost" 
                  size="iconSm"
                  onClick={() => setShowLinkPicker(!showLinkPicker)}
                  className={showLinkPicker ? 'bg-primary/10 text-primary' : ''}
                  title="Insert Link [[]]"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="iconSm" title="Mention @">
                  <AtSign className="h-4 w-4" />
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

            {/* Link Picker Dropdown */}
            <AnimatePresence>
              {showLinkPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-16 left-1/2 -translate-x-1/2 z-50 w-80 bg-popover border border-border rounded-lg shadow-xl"
                >
                  <div className="p-3 border-b border-border">
                    <Input placeholder="Search notes to link..." autoFocus className="bg-muted/50" />
                  </div>
                  <ScrollArea className="max-h-64">
                    <div className="p-2 space-y-1">
                      {enhancedNotes.map(note => (
                        <button
                          key={note.id}
                          onClick={() => {
                            // Insert wiki link at cursor position
                            setShowLinkPicker(false);
                          }}
                          className="w-full text-left p-2 rounded-md hover:bg-accent flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{note.title}</p>
                            <p className="text-xs text-muted-foreground">{note.notebook} / {note.section}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-2 border-t border-border">
                    <Button variant="ghost" size="sm" className="w-full gap-2">
                      <Plus className="h-4 w-4" />
                      Create new note
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Editor Content */}
            <ScrollArea className="flex-1">
              <div className="max-w-4xl mx-auto p-8">
                <input
                  type="text"
                  defaultValue={selectedNote.title}
                  className="w-full text-3xl font-bold bg-transparent border-none outline-none text-foreground mb-4 placeholder:text-muted-foreground"
                  placeholder="Untitled Note"
                />
                
                {/* Metadata Bar */}
                <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {selectedNote.createdBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(selectedNote.updatedAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Link2 className="h-3.5 w-3.5" />
                    {selectedNote.wikiLinks?.length || 0} links
                  </span>
                  {selectedNote.backlinks && selectedNote.backlinks.length > 0 && (
                    <span className="flex items-center gap-1 text-primary">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      {selectedNote.backlinks.length} backlinks
                    </span>
                  )}
                </div>
                
                {/* Tags */}
                <div className="flex items-center gap-2 mb-6 flex-wrap">
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
                <div 
                  className="prose prose-invert max-w-none min-h-[400px] focus:outline-none"
                  onClick={handleContentClick}
                  dangerouslySetInnerHTML={{ __html: renderContent(selectedNote.content) }}
                />
                
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
                <span>Created {new Date(selectedNote.createdAt).toLocaleDateString()}</span>
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

      {/* Right Panel - Links, Backlinks, Graph */}
      <div className="w-80 border-l border-border bg-sidebar flex flex-col">
        <Tabs value={rightPanelTab} onValueChange={(v) => setRightPanelTab(v as 'ai' | 'links' | 'graph')} className="flex flex-col h-full">
          <TabsList className="m-2 grid grid-cols-3">
            <TabsTrigger value="links" className="text-xs">Links</TabsTrigger>
            <TabsTrigger value="graph" className="text-xs">Graph</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">AI</TabsTrigger>
          </TabsList>
          
          <TabsContent value="links" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6">
                {/* Outgoing Links */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                    Outgoing Links
                    {selectedNote?.wikiLinks && (
                      <Badge variant="secondary" className="text-xs ml-auto">{selectedNote.wikiLinks.length}</Badge>
                    )}
                  </h4>
                  <div className="space-y-2">
                    {selectedNote?.wikiLinks?.map(link => {
                      const linkedNote = enhancedNotes.find(n => n.title === link);
                      return (
                        <button
                          key={link}
                          onClick={() => linkedNote && setSelectedNote(linkedNote)}
                          className={cn(
                            'w-full text-left p-2 rounded-md text-sm transition-colors',
                            linkedNote ? 'hover:bg-accent cursor-pointer' : 'opacity-50'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className={linkedNote ? 'text-foreground' : 'text-muted-foreground italic'}>
                              {link}
                            </span>
                            {!linkedNote && (
                              <Badge variant="outline" className="text-[10px] px-1 ml-auto">
                                Create
                              </Badge>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    {(!selectedNote?.wikiLinks || selectedNote.wikiLinks.length === 0) && (
                      <p className="text-xs text-muted-foreground p-2">No outgoing links</p>
                    )}
                  </div>
                </div>

                {/* Backlinks */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-success" />
                    Backlinks
                    {selectedNote?.backlinks && (
                      <Badge variant="secondary" className="text-xs ml-auto">{selectedNote.backlinks.length}</Badge>
                    )}
                  </h4>
                  <div className="space-y-2">
                    {selectedNote?.backlinks?.map(backlink => {
                      const sourceNote = enhancedNotes.find(n => n.id === backlink.noteId);
                      return (
                        <button
                          key={backlink.noteId}
                          onClick={() => sourceNote && setSelectedNote(sourceNote)}
                          className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors"
                        >
                          <p className="text-sm font-medium text-foreground">{backlink.noteTitle}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {backlink.context.replace(/\[\[(.*?)\]\]/g, '$1')}
                          </p>
                        </button>
                      );
                    })}
                    {(!selectedNote?.backlinks || selectedNote.backlinks.length === 0) && (
                      <p className="text-xs text-muted-foreground p-2">No pages link to this note</p>
                    )}
                  </div>
                </div>

                {/* Mentions */}
                {selectedNote?.mentions && selectedNote.mentions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <AtSign className="h-4 w-4 text-blue-400" />
                      Mentions
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNote.mentions.map(mention => (
                        <Badge key={mention} variant="outline" className="text-xs">
                          {mention}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="graph" className="flex-1 overflow-hidden m-0">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-border">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Network className="h-4 w-4 text-primary" />
                  Knowledge Graph
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {graphData.nodes.length} notes • {graphData.edges.length} connections
                </p>
              </div>
              
              <div className="flex-1 p-4 relative">
                {/* Simple graph visualization */}
                <div className="w-full h-full bg-muted/30 rounded-lg border border-border relative overflow-hidden">
                  <svg className="w-full h-full">
                    {/* Draw edges */}
                    {graphData.edges.map((edge, idx) => {
                      const fromNode = graphData.nodes.findIndex(n => n.id === edge.from);
                      const toNode = graphData.nodes.findIndex(n => n.id === edge.to);
                      if (fromNode === -1 || toNode === -1) return null;
                      
                      const totalNodes = graphData.nodes.length;
                      const fromAngle = (fromNode / totalNodes) * 2 * Math.PI - Math.PI / 2;
                      const toAngle = (toNode / totalNodes) * 2 * Math.PI - Math.PI / 2;
                      const radius = 80;
                      const centerX = 140;
                      const centerY = 120;
                      
                      const x1 = centerX + radius * Math.cos(fromAngle);
                      const y1 = centerY + radius * Math.sin(fromAngle);
                      const x2 = centerX + radius * Math.cos(toAngle);
                      const y2 = centerY + radius * Math.sin(toAngle);
                      
                      return (
                        <line
                          key={idx}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="hsl(var(--primary) / 0.3)"
                          strokeWidth="1"
                        />
                      );
                    })}
                    
                    {/* Draw nodes */}
                    {graphData.nodes.map((node, idx) => {
                      const totalNodes = graphData.nodes.length;
                      const angle = (idx / totalNodes) * 2 * Math.PI - Math.PI / 2;
                      const radius = 80;
                      const centerX = 140;
                      const centerY = 120;
                      const x = centerX + radius * Math.cos(angle);
                      const y = centerY + radius * Math.sin(angle);
                      
                      const isSelected = selectedNote?.id === node.id;
                      
                      return (
                        <g key={node.id}>
                          <circle
                            cx={x}
                            cy={y}
                            r={isSelected ? 8 : 6}
                            fill={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                            className="cursor-pointer transition-all hover:r-8"
                            onClick={() => {
                              const note = enhancedNotes.find(n => n.id === node.id);
                              if (note) setSelectedNote(note);
                            }}
                          />
                          <text
                            x={x}
                            y={y + 18}
                            textAnchor="middle"
                            fill="hsl(var(--muted-foreground))"
                            fontSize="8"
                            className="pointer-events-none"
                          >
                            {node.label.length > 15 ? node.label.slice(0, 15) + '...' : node.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
              
              <div className="p-4 border-t border-border">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  Expand Graph View
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ai" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">Quick Actions</h4>
                    <div className="space-y-2">
                      {['Summarize note', 'Extract action items', 'Find related decisions', 'Generate questions', 'Suggest tags'].map(action => (
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
                      {allTags.slice(0, 6).map(tag => (
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
                    {enhancedNotes.filter(n => n.id !== selectedNote?.id).slice(0, 3).map(note => (
                      <button
                        key={note.id}
                        onClick={() => setSelectedNote(note)}
                        className="w-full text-left p-2 rounded-md hover:bg-accent text-sm"
                      >
                        <p className="font-medium text-foreground truncate">{note.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.floor(Math.random() * 30 + 70)}% match
                        </p>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
