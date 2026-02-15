import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Users,
  Plus,
  Filter,
  Search,
  Mail,
  Phone,
  Building2,
  Star,
  StarOff,
  MoreHorizontal,
  Grid3X3,
  List,
  ArrowUp,
  ArrowDown,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';


const raciMatrix = [
  { activity: 'Project Charter Approval', roles: { sponsor: 'A', pm: 'R', techLead: 'C', business: 'I' } },
  { activity: 'Budget Allocation', roles: { sponsor: 'A', pm: 'R', techLead: 'I', business: 'C' } },
  { activity: 'Technical Architecture', roles: { sponsor: 'I', pm: 'C', techLead: 'R/A', business: 'I' } },
  { activity: 'Business Requirements', roles: { sponsor: 'I', pm: 'C', techLead: 'C', business: 'R/A' } },
  { activity: 'Go/No-Go Decision', roles: { sponsor: 'A', pm: 'R', techLead: 'C', business: 'C' } },
  { activity: 'Change Requests', roles: { sponsor: 'A', pm: 'R', techLead: 'C', business: 'C' } },
];

import { useProjectContext } from '@/contexts/ProjectContext';
import { useStakeholders, Stakeholder } from '@/hooks/useStakeholders';
import { Loader2 } from 'lucide-react';

export default function StakeholderRegisterView() {
  const { settings } = useProjectContext();
  const { data: stakeholders = [], isLoading } = useStakeholders(settings.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null);

  const filteredStakeholders = stakeholders.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.role?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (s.organization?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const getInfluenceInterestQuadrant = (influence: string, interest: string) => {
    if (influence === 'high' && interest === 'high') return 'Manage Closely';
    if (influence === 'high' && interest !== 'high') return 'Keep Satisfied';
    if (influence !== 'high' && interest === 'high') return 'Keep Informed';
    return 'Monitor';
  };

  const getQuadrantColor = (quadrant: string) => {
    switch (quadrant) {
      case 'Manage Closely': return 'bg-destructive/20 text-destructive';
      case 'Keep Satisfied': return 'bg-warning/20 text-warning';
      case 'Keep Informed': return 'bg-info/20 text-info';
      default: return 'bg-muted text-muted-foreground';
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
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-6 border-b bg-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Stakeholder Register</h1>
              <p className="text-muted-foreground">Manage stakeholder engagement and communication</p>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Stakeholder
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6">
        <Tabs defaultValue="register" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="register">Register</TabsTrigger>
              <TabsTrigger value="matrix">Power/Interest Matrix</TabsTrigger>
              <TabsTrigger value="raci">RACI Matrix</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stakeholders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
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

          <TabsContent value="register">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStakeholders.map((stakeholder) => (
                  <motion.div
                    key={stakeholder.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2 }}
                    className="cursor-pointer"
                    onClick={() => setSelectedStakeholder(stakeholder)}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-primary/20 text-primary">
                                {stakeholder.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{stakeholder.name}</h3>
                                {stakeholder.is_key_stakeholder && (
                                  <Star className="h-4 w-4 text-warning fill-warning" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{stakeholder.role}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="iconXs">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                          <Building2 className="h-3 w-3" />
                          {stakeholder.organization}
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          <Badge variant={stakeholder.category === 'internal' ? 'secondary' : stakeholder.category === 'partner' ? 'info' : 'outline'}>
                            {stakeholder.category}
                          </Badge>
                          <Badge variant={stakeholder.engagement === 'supportive' ? 'success' : stakeholder.engagement === 'resistant' ? 'destructive' : 'warning'}>
                            {stakeholder.engagement}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Influence:</span>
                            <Badge variant={(stakeholder.influence || 'low') === 'high' ? 'destructive' : (stakeholder.influence || 'low') === 'medium' ? 'warning' : 'secondary'}>
                              {stakeholder.influence}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Interest:</span>
                            <Badge variant={(stakeholder.interest || 'low') === 'high' ? 'info' : (stakeholder.interest || 'low') === 'medium' ? 'warning' : 'secondary'}>
                              {stakeholder.interest}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t">
                          <span className={cn(
                            "text-xs px-2 py-1 rounded",
                            getQuadrantColor(getInfluenceInterestQuadrant(stakeholder.influence || 'low', stakeholder.interest || 'low'))
                          )}>
                            {getInfluenceInterestQuadrant(stakeholder.influence || 'low', stakeholder.interest || 'low')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stakeholder</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Influence</TableHead>
                      <TableHead>Interest</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Strategy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStakeholders.map((stakeholder) => (
                      <TableRow key={stakeholder.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {stakeholder.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{stakeholder.name}</span>
                              {stakeholder.is_key_stakeholder && (
                                <Star className="h-3 w-3 text-warning fill-warning" />
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{stakeholder.role}</TableCell>
                        <TableCell>{stakeholder.organization}</TableCell>
                        <TableCell>
                          <Badge variant={(stakeholder.influence || 'low') === 'high' ? 'destructive' : (stakeholder.influence || 'low') === 'medium' ? 'warning' : 'secondary'}>
                            {stakeholder.influence}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={(stakeholder.interest || 'low') === 'high' ? 'info' : (stakeholder.interest || 'low') === 'medium' ? 'warning' : 'secondary'}>
                            {stakeholder.interest}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={stakeholder.engagement === 'supportive' ? 'success' : stakeholder.engagement === 'resistant' ? 'destructive' : 'warning'}>
                            {stakeholder.engagement}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "text-xs px-2 py-1 rounded",
                            getQuadrantColor(getInfluenceInterestQuadrant(stakeholder.influence || 'low', stakeholder.interest || 'low'))
                          )}>
                            {getInfluenceInterestQuadrant(stakeholder.influence || 'low', stakeholder.interest || 'low')}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="matrix">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Power/Interest Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto">
                  {/* High Power, Low Interest */}
                  <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowUp className="h-4 w-4 text-warning" />
                      <span className="font-medium text-warning">Keep Satisfied</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">High Influence, Low Interest</p>
                    <div className="space-y-2">
                      {filteredStakeholders
                        .filter(s => s.influence === 'high' && s.interest !== 'high')
                        .map(s => (
                          <div key={s.id} className="flex items-center gap-2 p-2 rounded bg-background">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{s.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{s.name}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* High Power, High Interest */}
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowUp className="h-4 w-4 text-destructive" />
                      <span className="font-medium text-destructive">Manage Closely</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">High Influence, High Interest</p>
                    <div className="space-y-2">
                      {filteredStakeholders
                        .filter(s => s.influence === 'high' && s.interest === 'high')
                        .map(s => (
                          <div key={s.id} className="flex items-center gap-2 p-2 rounded bg-background">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{s.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{s.name}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Low Power, Low Interest */}
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowDown className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Monitor</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Low Influence, Low Interest</p>
                    <div className="space-y-2">
                      {filteredStakeholders
                        .filter(s => s.influence !== 'high' && s.interest !== 'high')
                        .map(s => (
                          <div key={s.id} className="flex items-center gap-2 p-2 rounded bg-background">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{s.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{s.name}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Low Power, High Interest */}
                  <div className="p-4 rounded-lg bg-info/10 border border-info/30">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowRight className="h-4 w-4 text-info" />
                      <span className="font-medium text-info">Keep Informed</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Low Influence, High Interest</p>
                    <div className="space-y-2">
                      {filteredStakeholders
                        .filter(s => s.influence !== 'high' && s.interest === 'high')
                        .map(s => (
                          <div key={s.id} className="flex items-center gap-2 p-2 rounded bg-background">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{s.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{s.name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="raci">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">RACI Matrix</CardTitle>
                <p className="text-sm text-muted-foreground">R=Responsible, A=Accountable, C=Consulted, I=Informed</p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Activity</TableHead>
                      <TableHead className="text-center">Executive Sponsor</TableHead>
                      <TableHead className="text-center">Project Manager</TableHead>
                      <TableHead className="text-center">Technical Lead</TableHead>
                      <TableHead className="text-center">Business Owner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {raciMatrix.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.activity}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={row.roles.sponsor.includes('A') ? 'destructive' : row.roles.sponsor.includes('R') ? 'info' : 'secondary'}>
                            {row.roles.sponsor}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={row.roles.pm.includes('A') ? 'destructive' : row.roles.pm.includes('R') ? 'info' : 'secondary'}>
                            {row.roles.pm}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={row.roles.techLead.includes('A') ? 'destructive' : row.roles.techLead.includes('R') ? 'info' : 'secondary'}>
                            {row.roles.techLead}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={row.roles.business.includes('A') ? 'destructive' : row.roles.business.includes('R') ? 'info' : 'secondary'}>
                            {row.roles.business}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
