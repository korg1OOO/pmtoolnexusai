import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentIndicator } from './AgentIndicator';
import type { AIMessage } from '@/types/ai-agents';

interface ChatMessageProps {
  message: AIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

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
                  li: ({ children }) => <li className="mb-1">{children}</li>,
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

        {/* Permission Denied Warning */}
        {message.metadata?.permissionDenied && (
          <div className="mt-2 text-xs text-destructive flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
            Access restricted
          </div>
        )}

        {/* Timestamp */}
        <div
          className={cn(
            "text-xs text-muted-foreground mt-1",
            isUser && "text-right"
          )}
        >
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
