import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Check, LayoutDashboard, FileText, BarChart3, Activity, DollarSign, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { embeddableComponents, EmbeddableComponent, EmbeddableComponentCategory } from '@/lib/embeddableComponents';

interface ComponentPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectComponent: (component: EmbeddableComponent) => void;
}

const categoryIcons: Record<EmbeddableComponentCategory, React.ElementType> = {
  dashboard: LayoutDashboard,
  executive: Target,
  strategic: Activity,
  briefing: FileText,
  reports: BarChart3,
  financial: DollarSign,
};

const categoryLabelsMap: Record<EmbeddableComponentCategory, string> = {
  dashboard: 'Project Dashboard',
  executive: 'Executive Dashboard',
  strategic: 'Strategic Dashboard',
  briefing: 'Morning Briefing',
  reports: 'Reports',
  financial: 'Financial',
};

export function ComponentPicker({
  open,
  onOpenChange,
  onSelectComponent,
}: ComponentPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EmbeddableComponentCategory | 'all'>('all');
  const [selectedComponent, setSelectedComponent] = useState<EmbeddableComponent | null>(null);

  const filteredComponents = useMemo(() => {
    let components = embeddableComponents;

    if (selectedCategory !== 'all') {
      components = components.filter((c) => c.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      components = components.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.sourceModule.toLowerCase().includes(query)
      );
    }

    return components;
  }, [searchQuery, selectedCategory]);

  const componentsByCategory = useMemo(() => {
    const grouped: Record<EmbeddableComponentCategory, EmbeddableComponent[]> = {
      dashboard: [],
      executive: [],
      strategic: [],
      briefing: [],
      reports: [],
      financial: [],
    };

    filteredComponents.forEach((c) => {
      if (grouped[c.category]) {
        grouped[c.category].push(c);
      }
    });

    return grouped;
  }, [filteredComponents]);

  const handleInsert = () => {
    if (selectedComponent) {
      onSelectComponent(selectedComponent);
      setSelectedComponent(null);
      setSearchQuery('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Insert Dashboard Component</DialogTitle>
          <DialogDescription>
            Select a component to embed in your slide. Live data components can be refreshed when the presentation is active.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as EmbeddableComponentCategory | 'all')}>
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            {(Object.keys(categoryLabelsMap) as EmbeddableComponentCategory[]).map((category) => (
              <TabsTrigger key={category} value={category} className="gap-1 text-xs">
                {React.createElement(categoryIcons[category], { className: 'h-3 w-3' })}
                <span className="hidden lg:inline">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {selectedCategory === 'all' ? (
                (Object.keys(componentsByCategory) as EmbeddableComponentCategory[]).map((category) => {
                  const components = componentsByCategory[category];
                  if (components.length === 0) return null;

                  return (
                    <div key={category} className="mb-6">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        {React.createElement(categoryIcons[category], { className: 'h-4 w-4' })}
                        {categoryLabelsMap[category]}
                        <Badge variant="secondary" className="ml-auto">
                          {components.length}
                        </Badge>
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {components.map((component) => (
                          <ComponentCard
                            key={component.id}
                            component={component}
                            isSelected={selectedComponent?.id === component.id}
                            onSelect={() => setSelectedComponent(component)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredComponents.map((component) => (
                    <ComponentCard
                      key={component.id}
                      component={component}
                      isSelected={selectedComponent?.id === component.id}
                      onSelect={() => setSelectedComponent(component)}
                    />
                  ))}
                </div>
              )}

              {filteredComponents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                  <p>No components found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedComponent ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Selected: <strong>{selectedComponent.name}</strong>
              </span>
            ) : (
              'Select a component to insert'
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsert} disabled={!selectedComponent}>
              Insert Component
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ComponentCardProps {
  component: EmbeddableComponent;
  isSelected: boolean;
  onSelect: () => void;
}

function ComponentCard({ component, isSelected, onSelect }: ComponentCardProps) {
  const Icon = component.icon;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
        'hover:border-primary/50 hover:bg-muted/50',
        isSelected && 'border-primary bg-primary/5 ring-1 ring-primary'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center',
          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{component.name}</span>
          {component.refreshable && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              Live
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {component.description || `From ${component.sourceModule}`}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <Badge variant="secondary" className="text-[10px]">
            {component.type}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {component.sourceModule}
          </Badge>
        </div>
      </div>
      {isSelected && (
        <Check className="h-5 w-5 text-primary flex-shrink-0" />
      )}
    </button>
  );
}
