import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Lightbulb,
  Plus,
  Filter,
  Search,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Tag,
  Calendar,
  User,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
  BookOpen,
  Share2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useLessonsLearned, LessonLearned } from '@/hooks/useLessonsLearned';

export function LessonsLearnedView() {
  const { settings } = useProjectContext();
  const { data: lessons = [], isLoading } = useLessonsLearned(settings.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<LessonLearned | null>(null);

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Lightbulb className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Lessons Learned</h1>
              <p className="text-muted-foreground">Capture and share project insights for future success</p>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Lesson
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 border-b grid grid-cols-4 gap-4">
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
      </div>

      {/* Search & Filters */}
      <div className="p-4 border-b flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* Lessons List */}
        <div className="flex-1 overflow-auto p-6">
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
                  <Button variant="ghost" size="iconSm">
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
          <div className="w-96 border-l p-6 overflow-auto bg-muted/20">
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
                {(Array.isArray(selectedLesson.recommendations) ? selectedLesson.recommendations : []).map((rec: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
                {(!selectedLesson.recommendations || (Array.isArray(selectedLesson.recommendations) && selectedLesson.recommendations.length === 0)) && (
                  <p className="text-sm text-muted-foreground italic">No recommendations provided.</p>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-4 border-t flex gap-2">
              <Button variant="outline" className="flex-1">
                <ThumbsUp className="h-4 w-4 mr-2" />
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
    </div>
  );
}
