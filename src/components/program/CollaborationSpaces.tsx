import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Users,
    Plus,
    Search,
    FileText,
    Calendar,
    CheckSquare,
    Archive,
    MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    getActiveCollaborationSpaces,
    getSpaceStats
} from '@/services/collaborationSpaceService';

interface CollaborationSpacesProps {
    programId: string;
}

export function CollaborationSpaces({ programId }: CollaborationSpacesProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch spaces
    const { data: spaces = [], isLoading } = useQuery({
        queryKey: ['collaboration-spaces', programId],
        queryFn: () => getActiveCollaborationSpaces(programId)
    });

    // Filter spaces
    const filteredSpaces = spaces.filter(space =>
        space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        space.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Collaboration Spaces</h2>
                    <p className="text-muted-foreground">
                        Cross-project collaboration hubs
                    </p>
                </div>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Space
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search spaces..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Spaces Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        Loading spaces...
                    </div>
                ) : filteredSpaces.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No collaboration spaces found</p>
                    </div>
                ) : (
                    filteredSpaces.map(space => (
                        <SpaceCard key={space.id} space={space} />
                    ))
                )}
            </div>
        </div>
    );
}

function SpaceCard({ space }: { space: any }) {
    const { data: stats } = useQuery({
        queryKey: ['space-stats', space.id],
        queryFn: () => getSpaceStats(space.id)
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <h3 className="font-medium">{space.name}</h3>
                </div>
                <Button size="sm" variant="ghost">
                    <MoreVertical className="w-4 h-4" />
                </Button>
            </div>

            {space.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {space.description}
                </p>
            )}

            {stats && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{stats.member_count} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span>{stats.document_count} docs</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{stats.meeting_count} meetings</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-muted-foreground" />
                        <span>{stats.task_count} tasks</span>
                    </div>
                </div>
            )}

            <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{space.project_ids.length} projects</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                        {space.status}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
