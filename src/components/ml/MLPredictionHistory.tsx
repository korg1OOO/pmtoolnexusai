/**
 * ML Prediction History Browser
 * Browse and analyze past predictions with filtering and search
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Eye, ThumbsUp, ThumbsDown, Edit, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function MLPredictionHistory() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterFeedback, setFilterFeedback] = useState<string>('all');
    const [selectedPrediction, setSelectedPrediction] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Fetch predictions
    const { data: predictions, isLoading } = useQuery({
        queryKey: ['ml-prediction-history', filterType, filterFeedback],
        queryFn: async () => {
            let query = supabase
                .from('ml_predictions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (filterType !== 'all') {
                query = query.eq('prediction_type', filterType);
            }

            if (filterFeedback === 'accepted') {
                query = query.eq('user_accepted', true);
            } else if (filterFeedback === 'modified') {
                query = query.eq('user_modified', true);
            } else if (filterFeedback === 'rejected') {
                query = query.eq('user_accepted', false).eq('user_modified', false);
            } else if (filterFeedback === 'pending') {
                query = query.is('user_accepted', null);
            }

            const { data } = await query;
            return data || [];
        },
    });

    // Filter by search term
    const filteredPredictions = predictions?.filter(p =>
        searchTerm === '' ||
        p.prediction_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(p.prediction).toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    // Get unique prediction types
    const predictionTypes = Array.from(
        new Set(predictions?.map(p => p.prediction_type) || [])
    );

    const handleViewDetails = (prediction: any) => {
        setSelectedPrediction(prediction);
        setShowDetailModal(true);
    };

    const getFeedbackIcon = (prediction: any) => {
        if (prediction.user_accepted === true) {
            return <ThumbsUp className="h-4 w-4 text-green-500" />;
        } else if (prediction.user_modified === true) {
            return <Edit className="h-4 w-4 text-yellow-500" />;
        } else if (prediction.user_accepted === false && prediction.user_modified === false) {
            return <ThumbsDown className="h-4 w-4 text-red-500" />;
        }
        return <span className="text-muted-foreground text-xs">No feedback</span>;
    };

    const getFeedbackBadge = (prediction: any) => {
        if (prediction.user_accepted === true) {
            return <Badge className="bg-green-500">Accepted</Badge>;
        } else if (prediction.user_modified === true) {
            return <Badge className="bg-yellow-500">Modified</Badge>;
        } else if (prediction.user_accepted === false && prediction.user_modified === false) {
            return <Badge variant="destructive">Rejected</Badge>;
        }
        return <Badge variant="secondary">Pending</Badge>;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Loading prediction history...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">Prediction History</h2>
                <p className="text-muted-foreground mt-1">
                    Browse and analyze past AI predictions
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Search & Filter</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search predictions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {predictionTypes.map(type => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterFeedback} onValueChange={setFilterFeedback}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by feedback" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Feedback</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="modified">Modified</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Predictions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        Predictions ({filteredPredictions.length})
                    </CardTitle>
                    <CardDescription>
                        Click on a prediction to view details
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date/Time</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Confidence</TableHead>
                                <TableHead>Feedback</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPredictions.map((prediction) => (
                                <TableRow key={prediction.id} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell className="text-sm">
                                        {new Date(prediction.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{prediction.prediction_type}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {prediction.confidence !== null ? (
                                            <span className="font-medium">
                                                {Math.round(prediction.confidence * 100)}%
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getFeedbackIcon(prediction)}
                                            {getFeedbackBadge(prediction)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {prediction.user_rating ? (
                                            <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                <span>{prediction.user_rating}/5</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleViewDetails(prediction)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredPredictions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No predictions found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Prediction Detail Modal */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Prediction Details</DialogTitle>
                        <DialogDescription>
                            Complete information about this prediction
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPrediction && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Prediction Type</label>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedPrediction.prediction_type}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Created At</label>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(selectedPrediction.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Confidence</label>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedPrediction.confidence !== null
                                            ? `${Math.round(selectedPrediction.confidence * 100)}%`
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Feedback Status</label>
                                    <div className="mt-1">
                                        {getFeedbackBadge(selectedPrediction)}
                                    </div>
                                </div>
                            </div>

                            {selectedPrediction.user_rating && (
                                <div>
                                    <label className="text-sm font-medium">User Rating</label>
                                    <div className="flex items-center gap-1 mt-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`h-4 w-4 ${star <= selectedPrediction.user_rating
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                        <span className="ml-2 text-sm">
                                            {selectedPrediction.user_rating}/5
                                        </span>
                                    </div>
                                </div>
                            )}

                            {selectedPrediction.feedback_notes && (
                                <div>
                                    <label className="text-sm font-medium">Feedback Notes</label>
                                    <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-lg">
                                        {selectedPrediction.feedback_notes}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium">Input Data</label>
                                <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                                    {JSON.stringify(selectedPrediction.input_data, null, 2)}
                                </pre>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Prediction</label>
                                <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                                    {JSON.stringify(selectedPrediction.prediction, null, 2)}
                                </pre>
                            </div>

                            {selectedPrediction.actual_outcome && (
                                <div>
                                    <label className="text-sm font-medium">Actual Outcome</label>
                                    <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                                        {JSON.stringify(selectedPrediction.actual_outcome, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
