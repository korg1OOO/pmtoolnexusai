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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LessonLearned {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'improvement' | 'risk';
  category: string;
  phase: string;
  submittedBy: string;
  submittedDate: string;
  impact: 'high' | 'medium' | 'low';
  recommendations: string[];
  votes: number;
  comments: number;
  tags: string[];
}

const mockLessons: LessonLearned[] = [
  {
    id: 'LL-001',
    title: 'Early stakeholder engagement improved adoption',
    description: 'Involving end users in the design phase from week 2 significantly reduced resistance to change and resulted in higher user satisfaction scores. Regular demos and feedback sessions helped align expectations.',
    type: 'success',
    category: 'Stakeholder Management',
    phase: 'Phase 2: Design',
    submittedBy: 'Lisa Chen',
    submittedDate: '2024-11-20',
    impact: 'high',
    recommendations: [
      'Schedule weekly user demos from project start',
      'Create a user feedback channel on Teams',
      'Include at least 2 end users in all design reviews',
    ],
    votes: 12,
    comments: 5,
    tags: ['stakeholder', 'adoption', 'user-experience'],
  },
  {
    id: 'LL-002',
    title: 'Underestimated data migration complexity',
    description: 'The legacy data had more inconsistencies than initially documented. This caused delays in Wave 1 migration. More thorough data profiling in the discovery phase would have identified these issues earlier.',
    type: 'improvement',
    category: 'Technical',
    phase: 'Phase 3: Implementation',
    submittedBy: 'Emily Brown',
    submittedDate: '2024-11-18',
    impact: 'high',
    recommendations: [
      'Allocate 2 weeks for data profiling before migration planning',
      'Create data quality scorecard as a discovery deliverable',
      'Include data cleansing buffer in migration estimates',
    ],
    votes: 18,
    comments: 8,
    tags: ['data', 'migration', 'estimation'],
  },
  {
    id: 'LL-003',
    title: 'Cloud vendor escalation process saved timeline',
    description: 'When we hit a critical blocker with the API gateway, having pre-established escalation contacts at the cloud vendor allowed us to resolve the issue in 2 days instead of the typical 2-week support cycle.',
    type: 'success',
    category: 'Vendor Management',
    phase: 'Phase 3: Implementation',
    submittedBy: 'Mike Johnson',
    submittedDate: '2024-11-15',
    impact: 'medium',
    recommendations: [
      'Establish premium support contracts for critical projects',
      'Build relationships with vendor technical account managers',
      'Document escalation paths in project risk register',
    ],
    votes: 9,
    comments: 3,
    tags: ['vendor', 'support', 'escalation'],
  },
  {
    id: 'LL-004',
    title: 'Security review should happen earlier',
    description: 'Security team raised compliance concerns late in the design phase, requiring architecture changes. Earlier involvement would have prevented rework.',
    type: 'improvement',
    category: 'Governance',
    phase: 'Phase 2: Design',
    submittedBy: 'Robert Williams',
    submittedDate: '2024-11-12',
    impact: 'medium',
    recommendations: [
      'Include security architecture review in Phase 1 discovery',
      'Add security representative to project steering committee',
      'Create security checklist for cloud migration projects',
    ],
    votes: 15,
    comments: 6,
    tags: ['security', 'compliance', 'governance'],
  },
  {
    id: 'LL-005',
    title: 'Parallel testing environments accelerated delivery',
    description: 'Provisioning separate test environments for each migration wave allowed parallel testing and significantly reduced the overall testing timeline.',
    type: 'success',
    category: 'Technical',
    phase: 'Phase 4: Testing',
    submittedBy: 'David Wilson',
    submittedDate: '2024-11-10',
    impact: 'high',
    recommendations: [
      'Budget for parallel test environments in infrastructure costs',
      'Automate environment provisioning with IaC',
      'Define environment strategy in architecture design',
    ],
    votes: 11,
    comments: 4,
    tags: ['testing', 'infrastructure', 'automation'],
  },
];

export function LessonsLearnedView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<LessonLearned | null>(null);

  const filteredLessons = mockLessons.filter(l =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: mockLessons.length,
    successes: mockLessons.filter(l => l.type === 'success').length,
    improvements: mockLessons.filter(l => l.type === 'improvement').length,
    highImpact: mockLessons.filter(l => l.impact === 'high').length,
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <ThumbsUp className="h-4 w-4 text-success" />;
      case 'improvement': return <TrendingUp className="h-4 w-4 text-warning" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

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

      {/* Content */}
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
                        <Badge variant={lesson.impact === 'high' ? 'destructive' : lesson.impact === 'medium' ? 'warning' : 'secondary'}>
                          {lesson.impact} impact
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
                    {lesson.submittedBy}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(lesson.submittedDate).toLocaleDateString()}
                  </div>
                  <Badge variant="outline">{lesson.category}</Badge>
                  <Badge variant="secondary">{lesson.phase}</Badge>
                </div>

                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {lesson.tags.slice(0, 3).map((tag) => (
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
                      {lesson.comments}
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
              <Badge variant="outline">{selectedLesson.id}</Badge>
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
                  <p className="text-sm">{selectedLesson.category}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Phase</label>
                  <p className="text-sm">{selectedLesson.phase}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Impact</label>
                  <Badge variant={selectedLesson.impact === 'high' ? 'destructive' : selectedLesson.impact === 'medium' ? 'warning' : 'secondary'} className="mt-1">
                    {selectedLesson.impact}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <p className="text-sm mt-1">{selectedLesson.description}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedLesson.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground">Recommendations for Future Projects</label>
                {selectedLesson.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
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
