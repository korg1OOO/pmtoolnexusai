import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Lightbulb,
  ThumbsUp,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Calendar,
  User,
  CheckCircle2,
  MoreHorizontal,
  Share2,
  Loader2
} from 'lucide-react';
import { DataRegisterPage } from '@/components/ui/DataRegisterPage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type DynamicColumnDef } from '@/components/ui/DynamicDataGrid';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useAuth } from '@/hooks/useAuth';
import { useLessonsLearned, LessonLearned, useUpdateLessonLearned, useCreateLessonLearned } from '@/hooks/useLessonsLearned';
import { toast } from 'sonner';

const STANDARD_COLUMNS: DynamicColumnDef<LessonLearned>[] = [
  { key: 'title', label: 'Title', width: 250, type: 'text', sticky: true },
  { key: 'description', label: 'Description', width: 300, type: 'text' },
  { key: 'type', label: 'Type', width: 140, type: 'select', options: ['success', 'improvement', 'issue'] },
  { key: 'category', label: 'Category', width: 140, type: 'text' },
  { key: 'phase', label: 'Phase', width: 140, type: 'text' },
  { key: 'impact_level', label: 'Impact', width: 120, type: 'select', options: ['low', 'medium', 'high', 'critical'] },
  { key: 'votes', label: 'Votes', width: 100, type: 'text' },
];

export default function LessonsLearnedView() {
  const { settings } = useProjectContext();
  const { user } = useAuth();
  const { data: lessons = [], isLoading } = useLessonsLearned(settings.id);
  const updateLesson = useUpdateLessonLearned();
  const createLesson = useCreateLessonLearned();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<LessonLearned | null>(null);
  const [customColumns, setCustomColumns] = useState<DynamicColumnDef<LessonLearned>[]>([]);

  const handleCellSave = async (rowId: string, key: string, value: string) => {
    const isCustom = !STANDARD_COLUMNS.find(c => c.key === key);
    const item = lessons.find(i => i.id === rowId);
    if (!item) return;

    if (isCustom) {
      const cf = { ...(item.custom_fields ?? {}), [key]: value };
      await updateLesson.mutateAsync({ id: rowId, custom_fields: cf });
    } else {
      if (key === 'votes') {
        const numVal = parseInt(value, 10);
        await updateLesson.mutateAsync({ id: rowId, [key]: isNaN(numVal) ? undefined : numVal });
      } else {
        await updateLesson.mutateAsync({ id: rowId, [key]: value });
      }
    }
  };

  const handleVote = async (lesson: LessonLearned) => {
    await updateLesson.mutateAsync({
      id: lesson.id,
      votes: (Number(lesson.votes) || 0) + 1
    });
    if (selectedLesson?.id === lesson.id) {
      setSelectedLesson({ ...lesson, votes: (Number(lesson.votes) || 0) + 1 });
    }
  };

  const handleAddLesson = async () => {
    if (!settings.id) return;
    await createLesson.mutateAsync({
      project_id: settings.id,
      title: 'New Lesson Learned',
      description: 'Describe the lesson learned here...',
      type: 'success',
      category: 'General',
      impact_level: 'medium',
      phase: 'Execution',
      submitted_by: user?.id ?? '',
      submitted_by_name: 'Project Team Member',
      votes: 0,
      tags: ['new'],
      recommendations: []
    });
  };

  const filteredLessons = lessons.filter(l =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: lessons.length,
    successes: lessons.filter(l => l.type === 'success').length,
    improvements: lessons.filter(l => l.type === 'improvement').length,
    highImpact: lessons.filter(l => l.impact_level === 'high').length,
  };

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case 'success': return <ThumbsUp className="h-4 w-4 text-success" />;
      case 'improvement': return <TrendingUp className="h-4 w-4 text-warning" />;
      case 'issue': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpiCards = (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-sm text-muted-foreground">Total Lessons</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-success">{stats.successes}</div>
          <p className="text-sm text-muted-foreground">What Went Well</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-warning">{stats.improvements}</div>
          <p className="text-sm text-muted-foreground">Areas for Improvement</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-primary">{stats.highImpact}</div>
          <p className="text-sm text-muted-foreground">High Impact</p>
        </CardContent>
      </Card>
    </>
  );

  const listContent = (
    <div className="flex flex-col md:flex-row min-h-[600px] border shadow-sm rounded-md overflow-hidden bg-background w-full">
      {/* Lessons List */}
      <div className="flex-1 overflow-auto p-4 md:p-6 bg-muted/5">
        <div className="space-y-4">
          {filteredLessons.map((lesson) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ x: 2 }}
              onClick={() => setSelectedLesson(lesson)}
              className={cn(
                "p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer",
                selectedLesson?.id === lesson.id && 'border-primary bg-primary/5'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    lesson.type === 'success' ? 'bg-success/20' :
                      lesson.type === 'improvement' ? 'bg-warning/20' : 'bg-destructive/20'
                  )}>
                    {getTypeIcon(lesson.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{lesson.title}</h3>
                      <Badge variant={(lesson.impact_level === 'high' || lesson.impact_level === 'critical') ? 'destructive' : lesson.impact_level === 'medium' ? 'warning' : 'secondary'}>
                        {lesson.impact_level} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{lesson.description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More options">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-4 w-4" />
                  {lesson.submitted_by_name || 'Anonymous'}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {lesson.created_at ? new Date(lesson.created_at).toLocaleDateString() : 'N/A'}
                </div>
                <Badge variant="outline">{lesson.category}</Badge>
                <Badge variant="secondary">{lesson.phase}</Badge>
              </div>

              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(lesson.tags) ? lesson.tags : []).slice(0, 3).map((tag: any) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    {lesson.votes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    0
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedLesson && (
        <div className="w-full md:w-96 border-t md:border-t-0 md:border-l p-4 md:p-6 overflow-auto bg-muted/20 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Lesson Details</h2>
            <Badge variant="outline">{selectedLesson.id.slice(0, 8)}</Badge>
          </div>

          <Tabs defaultValue="details" className="space-y-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="recommendations">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <div className="flex items-center gap-2 mt-1">
                  {getTypeIcon(selectedLesson.type)}
                  <span className="text-sm capitalize">{selectedLesson.type}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <p className="text-sm">{selectedLesson.category || 'Uncategorized'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Phase</label>
                <p className="text-sm">{selectedLesson.phase || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Impact</label>
                <Badge variant={(selectedLesson.impact_level === 'high' || selectedLesson.impact_level === 'critical') ? 'destructive' : selectedLesson.impact_level === 'medium' ? 'warning' : 'secondary'} className="mt-1">
                  {selectedLesson.impact_level || 'low'}
                </Badge>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <p className="text-sm mt-1">{selectedLesson.description}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tags</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(Array.isArray(selectedLesson.tags) ? selectedLesson.tags : []).map((tag: any) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground">Recommendations for Future Projects</label>
              <h3 className="font-semibold mb-2">Recommendations</h3>
              <div className="space-y-2">
                {(Array.isArray(selectedLesson.recommendations) ? selectedLesson.recommendations : []).map((rec: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
                {(!selectedLesson.recommendations || (Array.isArray(selectedLesson.recommendations) && selectedLesson.recommendations.length === 0)) && (
                  <p className="text-sm text-muted-foreground italic">No recommendations provided.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleVote(selectedLesson)}
              disabled={updateLesson.isPending}
            >
              {updateLesson.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ThumbsUp className="h-4 w-4 mr-2" />}
              Vote ({selectedLesson.votes})
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <DataRegisterPage
      title="Lessons Learned"
      description="Capture and share project insights for future success"
      icon={Lightbulb}
      iconBgClass="bg-primary/20"
      iconColorClass="text-primary"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onAddRow={handleAddLesson}
      addLabel="Add Lesson"
      pdfFilename="lessons_learned"
      data={filteredLessons}
      baseColumns={STANDARD_COLUMNS}
      customColumns={customColumns}
      idExtractor={(item) => item.id}
      customFieldExtractor={(item, key) => String(item.custom_fields?.[key] ?? '')}
      onCellSave={handleCellSave}
      onAddColumn={(col) => {
        if (customColumns.find(c => c.key === col.key)) {
          toast.error('Column already exists');
          return;
        }
        setCustomColumns(prev => [...prev, col]);
        toast.success(`Column "${col.label}" added`);
      }}
      onRemoveColumn={(key) => setCustomColumns(prev => prev.filter(c => c.key !== key))}
      onDeleteRows={() => { }}
      emptyStateMessage={filteredLessons.length === 0 ? 'No lessons found.' : 'No lessons match your filters.'}
      kpiCards={kpiCards}
      listContent={listContent}
    />
  );
}
