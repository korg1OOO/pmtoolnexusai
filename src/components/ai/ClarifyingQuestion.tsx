import React from 'react';
import { HelpCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ClarifyingQuestionOption {
  id: string;
  label: string;
  description?: string;
}

export interface ClarifyingQuestionData {
  id: string;
  question: string;
  options: ClarifyingQuestionOption[];
  multiSelect?: boolean;
  context?: string;
}

interface ClarifyingQuestionProps {
  question: ClarifyingQuestionData;
  onAnswer: (questionId: string, selectedOptions: string[]) => void;
  onDismiss?: () => void;
  isLoading?: boolean;
}

export function ClarifyingQuestion({
  question,
  onAnswer,
  onDismiss,
  isLoading,
}: ClarifyingQuestionProps) {
  const [selected, setSelected] = React.useState<string[]>([]);

  const handleSelect = (optionId: string) => {
    if (question.multiSelect) {
      setSelected((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelected([optionId]);
    }
  };

  const handleSubmit = () => {
    if (selected.length > 0) {
      onAnswer(question.id, selected);
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-start gap-2">
          <HelpCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{question.question}</p>
            {question.context && (
              <p className="text-xs text-muted-foreground mt-1">
                {question.context}
              </p>
            )}
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={onDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="space-y-1.5">
          {question.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={isLoading}
              className={cn(
                'w-full text-left p-2 rounded-md border text-xs transition-all',
                selected.includes(option.id)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0',
                    selected.includes(option.id)
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  )}
                >
                  {selected.includes(option.id) && (
                    <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="font-medium">{option.label}</span>
                  {option.description && (
                    <p className="text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          {question.multiSelect && (
            <Badge variant="outline" className="text-xs">
              Select multiple
            </Badge>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={selected.length === 0 || isLoading}
            className="ml-auto"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
