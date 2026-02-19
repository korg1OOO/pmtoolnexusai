
import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AIFeedbackProps {
    onFeedback: (score: number, text?: string) => void;
    className?: string;
}

export function AIFeedback({ onFeedback, className }: AIFeedbackProps) {
    const [score, setScore] = useState<number | null>(null);
    const [comment, setComment] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const handleRate = (value: number) => {
        setScore(value);
        setIsOpen(true);
        // Immediate callback for score, update with text later if provided
        onFeedback(value);
    };

    const handleSubmitComment = () => {
        if (score) {
            onFeedback(score, comment);
            setIsOpen(false);
        }
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <span className="text-xs text-muted-foreground mr-2">Rate response:</span>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => handleRate(star)}
                        className={cn(
                            "hover:scale-110 transition-transform",
                            score && score >= star ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-400"
                        )}
                    >
                        <Star className="h-4 w-4 fill-current" />
                    </button>
                ))}
            </div>

            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <span className="w-0 h-0" />{/* Invisible trigger, controlled by state */}
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3">
                    <div className="space-y-3">
                        <h4 className="font-medium text-sm">Tell us more (optional)</h4>
                        <Textarea
                            placeholder="What was helpful or missing?"
                            className="h-20 text-sm"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>Skip</Button>
                            <Button size="sm" onClick={handleSubmitComment}>Submit</Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
