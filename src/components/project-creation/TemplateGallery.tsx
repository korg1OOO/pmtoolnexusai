import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Rocket,
  Palette,
  TrendingUp,
  Code,
  Building,
  GitMerge,
  Database,
  Layers,
  ArrowUpCircle,
  Users,
  RefreshCw,
  Zap,
  Shield,
  Cloud,
  Server,
  Eye,
  Clock,
  Target,
  Check,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { templateCategories, methodologyOptions } from '@/data/templateData';
import type { ProjectTemplate, TemplateCategory, Methodology } from '@/types/templates';

const iconMap: Record<string, React.ElementType> = {
  Rocket,
  Palette,
  TrendingUp,
  Code,
  Building,
  GitMerge,
  Database,
  Layers,
  ArrowUpCircle,
  Users,
  RefreshCw,
  Zap,
  Shield,
  Cloud,
  Server,
};

interface TemplateGalleryProps {
  templates: ProjectTemplate[];
  selectedTemplate: ProjectTemplate | null;
  onSelect: (template: ProjectTemplate) => void;
  onPreview: (template: ProjectTemplate) => void;
}

export function TemplateGallery({
  templates,
  selectedTemplate,
  onSelect,
  onPreview,
}: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | 'all'>('all');
  const [methodologyFilter, setMethodologyFilter] = useState<Methodology | 'all'>('all');
  const [complexityFilter, setComplexityFilter] = useState<string>('all');

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        searchQuery === '' ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
      const matchesMethodology = methodologyFilter === 'all' || template.methodology === methodologyFilter;
      const matchesComplexity = complexityFilter === 'all' || template.complexity === complexityFilter;

      return matchesSearch && matchesCategory && matchesMethodology && matchesComplexity;
    });
  }, [templates, searchQuery, categoryFilter, methodologyFilter, complexityFilter]);

  const getMethodologyLabel = (methodology: Methodology) => {
    const option = methodologyOptions.find((m) => m.id === methodology);
    return option?.name || methodology;
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low':
        return 'bg-green-500/10 text-green-500';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'high':
        return 'bg-orange-500/10 text-orange-500';
      case 'enterprise':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {templateCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={methodologyFilter} onValueChange={(v: any) => setMethodologyFilter(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Methodology" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methodologies</SelectItem>
              {methodologyOptions.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={complexityFilter} onValueChange={setComplexityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Complexity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-xs">
            All ({templates.length})
          </TabsTrigger>
          {templateCategories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
              {cat.name} ({cat.count})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const Icon = iconMap[template.icon] || Layers;
          const isSelected = selectedTemplate?.id === template.id;

          return (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className={`cursor-pointer transition-all h-full ${
                  isSelected
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => onSelect(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="p-2.5 rounded-lg shrink-0"
                      style={{ backgroundColor: `${template.color}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: template.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{template.name}</h3>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getMethodologyLabel(template.methodology)}
                        </Badge>
                        <Badge className={`text-xs ${getComplexityColor(template.complexity)}`}>
                          {template.complexity}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {template.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {template.phases.length} phases
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {template.aiMetadata.typicalDuration.min}-{template.aiMetadata.typicalDuration.max}{' '}
                        {template.aiMetadata.typicalDuration.unit.charAt(0)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreview(template);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                  </div>

                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
                      {template.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 4 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          +{template.tags.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground text-sm">
            Try adjusting your filters or search query.
          </p>
        </div>
      )}
    </div>
  );
}
