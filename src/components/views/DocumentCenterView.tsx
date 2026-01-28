import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  FolderOpen,
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  FilePlus,
  Upload,
  Search,
  Filter,
  Grid3X3,
  List,
  MoreHorizontal,
  Download,
  Share2,
  Trash2,
  Clock,
  User,
  Star,
  StarOff,
  Eye,
  FolderPlus,
  ChevronRight,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'xls' | 'ppt' | 'image' | 'other';
  size: number;
  uploadedBy: string;
  uploadedDate: string;
  modifiedDate: string;
  folder: string;
  starred: boolean;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
}

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  documentsCount: number;
}

const mockFolders: Folder[] = [
  { id: 'f1', name: 'Project Documentation', parentId: null, documentsCount: 12 },
  { id: 'f2', name: 'Design Documents', parentId: null, documentsCount: 8 },
  { id: 'f3', name: 'Meeting Minutes', parentId: null, documentsCount: 25 },
  { id: 'f4', name: 'Change Requests', parentId: null, documentsCount: 5 },
  { id: 'f5', name: 'Deliverables', parentId: null, documentsCount: 15 },
  { id: 'f6', name: 'Templates', parentId: null, documentsCount: 10 },
];

const mockDocuments: Document[] = [
  {
    id: 'd1',
    name: 'Project Charter v2.1.pdf',
    type: 'pdf',
    size: 2450000,
    uploadedBy: 'Sarah Mitchell',
    uploadedDate: '2024-01-15',
    modifiedDate: '2024-08-01',
    folder: 'Project Documentation',
    starred: true,
    version: '2.1',
    status: 'approved',
  },
  {
    id: 'd2',
    name: 'Cloud Architecture Design.docx',
    type: 'doc',
    size: 5600000,
    uploadedBy: 'Mike Johnson',
    uploadedDate: '2024-04-20',
    modifiedDate: '2024-07-15',
    folder: 'Design Documents',
    starred: true,
    version: '3.0',
    status: 'approved',
  },
  {
    id: 'd3',
    name: 'Budget Tracker.xlsx',
    type: 'xls',
    size: 1200000,
    uploadedBy: 'Sarah Mitchell',
    uploadedDate: '2024-01-10',
    modifiedDate: '2024-08-10',
    folder: 'Project Documentation',
    starred: false,
    version: '8.2',
    status: 'approved',
  },
  {
    id: 'd4',
    name: 'Steering Committee - Aug 2024.pdf',
    type: 'pdf',
    size: 3400000,
    uploadedBy: 'John Doe',
    uploadedDate: '2024-08-05',
    modifiedDate: '2024-08-05',
    folder: 'Meeting Minutes',
    starred: false,
    version: '1.0',
    status: 'approved',
  },
  {
    id: 'd5',
    name: 'Security Framework Spec.docx',
    type: 'doc',
    size: 4200000,
    uploadedBy: 'Emily Brown',
    uploadedDate: '2024-05-10',
    modifiedDate: '2024-06-28',
    folder: 'Design Documents',
    starred: false,
    version: '2.3',
    status: 'approved',
  },
  {
    id: 'd6',
    name: 'Data Migration Plan - Draft.docx',
    type: 'doc',
    size: 1800000,
    uploadedBy: 'Emily Brown',
    uploadedDate: '2024-07-20',
    modifiedDate: '2024-08-08',
    folder: 'Project Documentation',
    starred: false,
    version: '0.9',
    status: 'draft',
  },
  {
    id: 'd7',
    name: 'Training Materials.pptx',
    type: 'ppt',
    size: 8500000,
    uploadedBy: 'Lisa Chen',
    uploadedDate: '2024-08-02',
    modifiedDate: '2024-08-09',
    folder: 'Deliverables',
    starred: false,
    version: '1.2',
    status: 'review',
  },
];

export function DocumentCenterView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !currentFolder || doc.folder === currentFolder;
    const matchesStarred = !showStarredOnly || doc.starred;
    return matchesSearch && matchesFolder && matchesStarred;
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-5 w-5 text-destructive" />;
      case 'doc': return <FileText className="h-5 w-5 text-primary" />;
      case 'xls': return <FileSpreadsheet className="h-5 w-5 text-success" />;
      case 'ppt': return <FileText className="h-5 w-5 text-warning" />;
      case 'image': return <FileImage className="h-5 w-5 text-info" />;
      default: return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <FolderOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Document Center</h1>
              <p className="text-muted-foreground">Manage project documents and files</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </div>

      {/* Breadcrumb & Filters */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentFolder(null)}
            className={cn(!currentFolder && 'text-primary')}
          >
            <Home className="h-4 w-4 mr-1" />
            All Documents
          </Button>
          {currentFolder && (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{currentFolder}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showStarredOnly ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowStarredOnly(!showStarredOnly)}
          >
            <Star className={cn("h-4 w-4", showStarredOnly && 'fill-current')} />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setViewMode('grid')}>
            <Grid3X3 className={cn("h-4 w-4", viewMode === 'grid' && 'text-primary')} />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setViewMode('list')}>
            <List className={cn("h-4 w-4", viewMode === 'list' && 'text-primary')} />
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Folder Sidebar */}
        <div className="w-64 border-r p-4 space-y-2 overflow-auto">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">FOLDERS</h3>
          {mockFolders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setCurrentFolder(folder.name)}
              className={cn(
                "w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left",
                currentFolder === folder.name && 'bg-primary/10 text-primary'
              )}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                <span className="text-sm">{folder.name}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {folder.documentsCount}
              </Badge>
            </button>
          ))}
        </div>

        {/* Document Grid/List */}
        <div className="flex-1 p-6 overflow-auto">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className="hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-3 rounded-lg bg-muted">
                          {getFileIcon(doc.type)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="iconXs"
                            onClick={(e) => { e.stopPropagation(); }}
                          >
                            {doc.starred ? (
                              <Star className="h-4 w-4 text-warning fill-warning" />
                            ) : (
                              <StarOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="iconXs">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <h3 className="font-medium text-sm truncate mb-1">{doc.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {formatSize(doc.size)} • v{doc.version}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(doc.modifiedDate).toLocaleDateString()}
                        </div>
                        <Badge variant={
                          doc.status === 'approved' ? 'success' :
                          doc.status === 'draft' ? 'secondary' :
                          doc.status === 'review' ? 'warning' : 'outline'
                        } className="text-xs">
                          {doc.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <div className="divide-y">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-muted">
                      {getFileIcon(doc.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate">{doc.name}</h3>
                        {doc.starred && <Star className="h-3 w-3 text-warning fill-warning" />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {doc.folder} • {formatSize(doc.size)} • v{doc.version}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs">{doc.uploadedBy}</p>
                        <p className="text-xs text-muted-foreground">{new Date(doc.modifiedDate).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={
                        doc.status === 'approved' ? 'success' :
                        doc.status === 'draft' ? 'secondary' :
                        doc.status === 'review' ? 'warning' : 'outline'
                      }>
                        {doc.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="iconSm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                          <DropdownMenuItem><Download className="h-4 w-4 mr-2" />Download</DropdownMenuItem>
                          <DropdownMenuItem><Share2 className="h-4 w-4 mr-2" />Share</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
