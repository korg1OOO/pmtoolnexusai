import { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { 
  ListTodo, 
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  GripVertical,
  User,
  Calendar,
  Tag,
  Clock,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KPICard } from '@/components/enterprise/KPICard';

interface BacklogItem {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'enhancement' | 'technical-debt';
  priority: 'critical' | 'high' | 'medium' | 'low';
  storyPoints: number;
  assignee?: string;
  labels: string[];
  createdAt: string;
  sprint?: string;
}

const mockBacklogItems: BacklogItem[] = [
  { id: 'bl-1', title: 'Implement user authentication flow', description: 'Add OAuth2 integration with Google and GitHub providers', type: 'feature', priority: 'critical', storyPoints: 8, assignee: 'Emily Johnson', labels: ['auth', 'security'], createdAt: '2024-03-01', sprint: 'Sprint 12' },
  { id: 'bl-2', title: 'Fix dashboard loading performance', description: 'Optimize API calls and implement lazy loading for charts', type: 'bug', priority: 'high', storyPoints: 5, assignee: 'Robert Kim', labels: ['performance', 'dashboard'], createdAt: '2024-03-05' },
  { id: 'bl-3', title: 'Add dark mode support', description: 'Implement system-wide dark theme with user preference persistence', type: 'enhancement', priority: 'medium', storyPoints: 3, labels: ['ui', 'theming'], createdAt: '2024-03-10' },
  { id: 'bl-4', title: 'Refactor database queries', description: 'Optimize N+1 queries in project listing endpoints', type: 'technical-debt', priority: 'high', storyPoints: 5, labels: ['backend', 'database'], createdAt: '2024-03-12' },
  { id: 'bl-5', title: 'Real-time notifications', description: 'Implement WebSocket-based notification system', type: 'feature', priority: 'medium', storyPoints: 13, labels: ['notifications', 'real-time'], createdAt: '2024-03-15' },
  { id: 'bl-6', title: 'Export reports to PDF', description: 'Add PDF export functionality for all report types', type: 'feature', priority: 'low', storyPoints: 5, labels: ['reports', 'export'], createdAt: '2024-03-18' },
  { id: 'bl-7', title: 'Mobile responsive improvements', description: 'Fix layout issues on mobile devices', type: 'bug', priority: 'medium', storyPoints: 3, assignee: 'Anna Martinez', labels: ['mobile', 'responsive'], createdAt: '2024-03-20' },
  { id: 'bl-8', title: 'API rate limiting', description: 'Implement rate limiting for public API endpoints', type: 'technical-debt', priority: 'high', storyPoints: 8, labels: ['api', 'security'], createdAt: '2024-03-22' },
];

const getTypeColor = (type: BacklogItem['type']) => {
  switch (type) {
    case 'feature': return 'bg-primary/10 text-primary';
    case 'bug': return 'bg-destructive/10 text-destructive';
    case 'enhancement': return 'bg-success/10 text-success';
    case 'technical-debt': return 'bg-warning/10 text-warning';
  }
};

const getPriorityVariant = (priority: BacklogItem['priority']) => {
  switch (priority) {
    case 'critical': return 'critical' as const;
    case 'high': return 'warning' as const;
    case 'medium': return 'default' as const;
    case 'low': return 'outline' as const;
  }
};

export function BacklogView() {
  const [items, setItems] = useState(mockBacklogItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalPoints = items.reduce((sum, item) => sum + item.storyPoints, 0);
  const scheduledPoints = items.filter(i => i.sprint).reduce((sum, item) => sum + item.storyPoints, 0);

  const typeCounts = {
    feature: items.filter(i => i.type === 'feature').length,
    bug: items.filter(i => i.type === 'bug').length,
    enhancement: items.filter(i => i.type === 'enhancement').length,
    technicalDebt: items.filter(i => i.type === 'technical-debt').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Product Backlog</h1>
          <p className="text-sm text-muted-foreground mt-1">Prioritize and manage upcoming work items</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard 
          title="Total Items" 
          value={items.length.toString()} 
          subtitle={`${totalPoints} story points`}
          icon={ListTodo} 
          status="neutral" 
        />
        <KPICard 
          title="Features" 
          value={typeCounts.feature.toString()} 
          subtitle="New functionality" 
          icon={Plus} 
          status="neutral" 
        />
        <KPICard 
          title="Bugs" 
          value={typeCounts.bug.toString()} 
          subtitle="Issues to resolve" 
          icon={Tag} 
          status={typeCounts.bug > 3 ? 'warning' : 'success'} 
        />
        <KPICard 
          title="Scheduled" 
          value={items.filter(i => i.sprint).length.toString()} 
          subtitle={`${scheduledPoints} points planned`}
          icon={Calendar} 
          status="neutral" 
        />
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search backlog items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Badge 
            variant={filterType === null ? 'default' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setFilterType(null)}
          >
            All
          </Badge>
          <Badge 
            variant={filterType === 'feature' ? 'default' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setFilterType('feature')}
          >
            Features
          </Badge>
          <Badge 
            variant={filterType === 'bug' ? 'critical' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setFilterType('bug')}
          >
            Bugs
          </Badge>
          <Badge 
            variant={filterType === 'enhancement' ? 'active' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setFilterType('enhancement')}
          >
            Enhancements
          </Badge>
          <Badge 
            variant={filterType === 'technical-debt' ? 'warning' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setFilterType('technical-debt')}
          >
            Tech Debt
          </Badge>
        </div>
      </div>

      {/* Backlog List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Backlog Items</CardTitle>
            <span className="text-sm text-muted-foreground">{filteredItems.length} items</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Reorder.Group values={filteredItems} onReorder={setItems} className="divide-y divide-border">
            {filteredItems.map((item) => (
              <Reorder.Item
                key={item.id}
                value={item}
                className="bg-background"
              >
                <motion.div
                  className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="cursor-grab text-muted-foreground hover:text-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(item.type)}`}>
                          {item.type.replace('-', ' ')}
                        </span>
                        <h3 className="font-medium text-foreground">{item.title}</h3>
                        <Badge variant={getPriorityVariant(item.priority)} className="text-xs">
                          {item.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                      
                      {/* Expanded Content */}
                      {expandedItem === item.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-3 space-y-3"
                        >
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {item.labels.map((label, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {label}
                              </Badge>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{item.storyPoints} pts</span>
                      </div>
                      
                      {item.assignee && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span className="max-w-[100px] truncate">{item.assignee}</span>
                        </div>
                      )}
                      
                      {item.sprint && (
                        <Badge variant="active" className="text-xs">
                          {item.sprint}
                        </Badge>
                      )}
                      
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform ${expandedItem === item.id ? 'rotate-180' : ''}`} 
                      />
                      
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </CardContent>
      </Card>
    </div>
  );
}
