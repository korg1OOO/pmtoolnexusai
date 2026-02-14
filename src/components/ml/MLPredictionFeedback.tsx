/**
 * ML Prediction Feedback Component
 * Allows users to provide feedback on AI predictions
 */

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useRecordMLFeedback } from '@/hooks/useMLLearning';

interface MLPredictionFeedbackProps {
    predictionId: string;
    predictionType: string;
    prediction: any;
    onFeedbackSubmitted?: () => void;
    compact?: boolean;
}

export function MLPredictionFeedback({
    predictionId,
    predictionType,
    prediction,
    onFeedbackSubmitted,
    compact = false,
}: MLPredictionFeedbackProps) {
    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
    const [rating, setRating] = useState<number>(0);
    const [feedbackCategory, setFeedbackCategory] = useState<string>('');
    const [feedbackNotes, setFeedbackNotes] = useState('');
    const [userModified, setUserModified] = useState(false);
    const [actualOutcome, setActualOutcome] = useState<any>(null);

    const recordFeedback = useRecordMLFeedback();

    const handleAccept = () => {
        recordFeedback.mutate({
            predictionId,
            feedback: {
                user_accepted: true,
                user_modified: false,
                user_rating: 5,
            },
        });
        onFeedbackSubmitted?.();
    };

    const handleReject = () => {
        setShowFeedbackDialog(true);
        setUserModified(true);
    };

    const handleSubmitDetailedFeedback = () => {
        recordFeedback.mutate({
            predictionId,
            feedback: {
                user_accepted: false,
                user_modified: userModified,
                actual_outcome: actualOutcome,
                user_rating: rating,
                feedback_notes: feedbackNotes,
                feedback_category: feedbackCategory,
            },
        });
        setShowFeedbackDialog(false);
        onFeedbackSubmitted?.();
    };

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleAccept}
                    className="h-8"
                >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Accept
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleReject}
                    className="h-8"
                >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    Modify
                </Button>

                <FeedbackDialog
                    open={showFeedbackDialog}
                    onOpenChange={setShowFeedbackDialog}
                    predictionType={predictionType}
                    prediction={prediction}
                    rating={rating}
                    setRating={setRating}
                    feedbackCategory={feedbackCategory}
                    setFeedbackCategory={setFeedbackCategory}
                    feedbackNotes={feedbackNotes}
                    setFeedbackNotes={setFeedbackNotes}
                    setActualOutcome={setActualOutcome}
                    onSubmit={handleSubmitDetailedFeedback}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium">Was this prediction helpful?</h4>
                    <p className="text-sm text-muted-foreground">
                        Your feedback helps improve future predictions
                    </p>
                </div>
                <Badge variant="outline">{predictionType}</Badge>
            </div>

            <div className="flex gap-3">
                <Button
                    onClick={handleAccept}
                    variant="outline"
                    className="flex-1"
                >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Yes, accurate
                </Button>
                <Button
                    onClick={handleReject}
                    variant="outline"
                    className="flex-1"
                >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    No, needs adjustment
                </Button>
            </div>

            <FeedbackDialog
                open={showFeedbackDialog}
                onOpenChange={setShowFeedbackDialog}
                predictionType={predictionType}
                prediction={prediction}
                rating={rating}
                setRating={setRating}
                feedbackCategory={feedbackCategory}
                setFeedbackCategory={setFeedbackCategory}
                feedbackNotes={feedbackNotes}
                setFeedbackNotes={setFeedbackNotes}
                setActualOutcome={setActualOutcome}
                onSubmit={handleSubmitDetailedFeedback}
            />
        </div>
    );
}

interface FeedbackDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    predictionType: string;
    prediction: any;
    rating: number;
    setRating: (rating: number) => void;
    feedbackCategory: string;
    setFeedbackCategory: (category: string) => void;
    feedbackNotes: string;
    setFeedbackNotes: (notes: string) => void;
    setActualOutcome: (outcome: any) => void;
    onSubmit: () => void;
}

function FeedbackDialog({
    open,
    onOpenChange,
    predictionType,
    prediction,
    rating,
    setRating,
    feedbackCategory,
    setFeedbackCategory,
    feedbackNotes,
    setFeedbackNotes,
    setActualOutcome,
    onSubmit,
}: FeedbackDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Help us learn</DialogTitle>
                    <DialogDescription>
                        Tell us why this prediction wasn't accurate
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Rating */}
                    <div>
                        <Label>How would you rate this prediction?</Label>
                        <div className="flex gap-2 mt-2">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    onClick={() => setRating(value)}
                                    className="transition-colors"
                                    aria-label={`Rate ${value} stars`}
                                >
                                    <Star
                                        className={`h-6 w-6 ${value <= rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Feedback Category */}
                    <div>
                        <Label>Why was it inaccurate?</Label>
                        <RadioGroup
                            value={feedbackCategory}
                            onValueChange={setFeedbackCategory}
                            className="mt-2 space-y-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="urgent" id="urgent" />
                                <Label htmlFor="urgent" className="font-normal">
                                    More urgent than suggested
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="blocking" id="blocking" />
                                <Label htmlFor="blocking" className="font-normal">
                                    Blocking other tasks
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="stakeholder" id="stakeholder" />
                                <Label htmlFor="stakeholder" className="font-normal">
                                    Stakeholder request
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="context" id="context" />
                                <Label htmlFor="context" className="font-normal">
                                    Missing context
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="other" id="other" />
                                <Label htmlFor="other" className="font-normal">
                                    Other reason
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Additional Notes */}
                    <div>
                        <Label htmlFor="notes">Additional details (optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Help us understand what we missed..."
                            value={feedbackNotes}
                            onChange={(e) => setFeedbackNotes(e.target.value)}
                            className="mt-2"
                            rows={3}
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={onSubmit}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Submit Feedback
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
