import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AgentIndicator } from './AgentIndicator';
import type { AIMessage, AIAction } from '@/types/ai-agents';

interface ChatMessageProps {
  message: AIMessage;
  onActionRequest?: (action: AIAction) => void;
}

export function ChatMessage({ message, onActionRequest }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const actions = message.metadata?.actions as AIAction[] | undefined;

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "p-2 rounded-lg shrink-0",
          isUser ? "bg-primary" : "bg-primary/10"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-primary" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "flex-1 min-w-0",
          isUser && "text-right"
        )}
      >
        {/* Agent Indicator (for assistant messages) */}
        {!isUser && message.agent_type && (
          <AgentIndicator
            agentType={message.agent_type}
            metadata={message.metadata}
          />
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            "inline-block rounded-lg px-4 py-2 max-w-full",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                  // eslint-disable-next-line jsx-a11y/no-redundant-roles
                  li: ({ children, ...props }) => <li className="mb-1" {...props}>{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  code: ({ children }) => (
                    <code className="px-1 py-0.5 rounded bg-muted-foreground/10 text-xs">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="p-2 rounded bg-muted-foreground/10 overflow-x-auto text-xs my-2">
                      {children}
                    </pre>
                  ),
                  h3: ({ children }) => <h3 className="font-semibold mt-3 mb-1">{children}</h3>,
                  h4: ({ children }) => <h4 className="font-medium mt-2 mb-1">{children}</h4>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isUser && actions && actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.filter(a => !a.confirmed).map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant={action.type === 'delete' ? 'destructive' : 'default'}
                className="h-8 text-xs"
                onClick={() => onActionRequest?.(action)}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {action.type === 'confirm' ? 'Confirm' : `Confirm ${action.type}`}
              </Button>
            ))}
            {actions.some(a => !a.confirmed) && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => {
                  // Just dismiss - no action needed
                }}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Dismiss
              </Button>
            )}
          </div>
        )}

        {/* Confirmed Actions Badge */}
        {!isUser && actions && actions.some(a => a.confirmed) && (
          <div className="mt-2 flex items-center gap-1 text-xs text-primary">
            <CheckCircle className="h-3 w-3" />
            <span>Action confirmed</span>
          </div>
        )}

        {/* Permission Denied Warning */}
        {message.metadata?.permissionDenied && (
          <div className="mt-2 text-xs text-destructive flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
            Access restricted
          </div>
        )}

        {/* Execution Time */}
        {!isUser && message.metadata?.executionTime && (
          <div className="mt-1 text-xs text-muted-foreground">
            Processed in {Math.round(message.metadata.executionTime as number)}ms
          </div>
        )}

        {/* Timestamp & Credits */}
        <div
          className={cn(
            "flex items-center gap-2 mt-1",
            isUser ? "justify-end" : "justify-between"
          )}
        >
          <div className="text-[10px] text-muted-foreground">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>

          {!isUser && message.metadata?.creditsDeducted !== undefined && (
            <div className="text-[11px] text-muted-foreground font-normal">
              Credits Used: {message.metadata.creditsDeducted as number}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
