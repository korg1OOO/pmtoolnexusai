import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  X, 
  Send, 
  Plus, 
  History, 
  Trash2, 
  Loader2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAIChat } from '@/hooks/useAIChat';
import { useUserRole } from '@/hooks/useUserRole';
import { ChatMessage } from './ChatMessage';
import { AgentIndicator } from './AgentIndicator';
import { ActionConfirmDialog } from './ActionConfirmDialog';
import { ROLE_DISPLAY_NAMES, type ProjectRole, type AIAction } from '@/types/ai-agents';
import { toast } from 'sonner';

interface GlobalAISidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  projectId: string | null;
  projectName?: string;
}

export function GlobalAISidebar({ 
  isOpen, 
  onToggle, 
  projectId,
  projectName = 'Current Project'
}: GlobalAISidebarProps) {
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [pendingAction, setPendingAction] = useState<AIAction | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: userRole = 'viewer' } = useUserRole(projectId);
  
  const {
    messages,
    conversations,
    activeConversationId,
    isLoading,
    isSending,
    currentAgent,
    sendMessage,
    createConversation,
    selectConversation,
    deleteConversation,
  } = useAIChat({ projectId });

  // Handle action confirmation from chat messages
  const handleActionRequest = useCallback((action: AIAction) => {
    setPendingAction(action);
  }, []);

  const handleConfirmAction = useCallback(async () => {
    if (!pendingAction) return;
    
    setIsActionLoading(true);
    try {
      // Send confirmation message to AI
      await sendMessage(`Confirmed: ${pendingAction.description}`);
      toast.success('Action confirmed and executed');
    } catch (error) {
      toast.error('Failed to execute action');
    } finally {
      setIsActionLoading(false);
      setPendingAction(null);
    }
  }, [pendingAction, sendMessage]);

  const handleCancelAction = useCallback(() => {
    setPendingAction(null);
    toast.info('Action cancelled');
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus textarea when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = async () => {
    await createConversation();
    setShowHistory(false);
  };

  return (
    <>
      {/* Toggle Button (when closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-50"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-lg"
                  onClick={onToggle}
                >
                  <Sparkles className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>AI Assistant</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-background border-l z-50 flex flex-col shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">AI Assistant</h2>
                  <p className="text-xs text-muted-foreground">
                    {projectName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>History</TooltipContent>
                </Tooltip>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onToggle}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Role Badge */}
            <div className="px-4 py-2 border-b bg-muted/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your Role:</span>
                <Badge variant="outline" className="capitalize">
                  {ROLE_DISPLAY_NAMES[userRole as ProjectRole] || userRole}
                </Badge>
              </div>
            </div>

            {/* History Panel */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b overflow-hidden"
                >
                  <div className="p-2 max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2 px-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Recent Conversations
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={handleNewChat}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        New
                      </Button>
                    </div>
                    {conversations.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No conversations yet
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {conversations.slice(0, 5).map((conv) => (
                          <div
                            key={conv.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted/50 group",
                              activeConversationId === conv.id && "bg-muted"
                            )}
                            onClick={() => {
                              selectConversation(conv.id);
                              setShowHistory(false);
                            }}
                          >
                            <span className="text-sm truncate flex-1">
                              {conv.title}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conv.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="p-4 rounded-full bg-primary/10 mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-medium mb-2">How can I help you?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    I can analyze your project schedule, budget, risks, and more.
                  </p>
                  <div className="grid grid-cols-1 gap-2 w-full max-w-[280px]">
                    {[
                      "What's the project status?",
                      "Show me the critical path",
                      "Any schedule risks?",
                      "Generate a status report",
                    ].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        className="justify-start text-left h-auto py-2 px-3"
                        onClick={() => {
                          setInput(suggestion);
                          textareaRef.current?.focus();
                        }}
                      >
                        <ChevronRight className="h-3 w-3 mr-2 shrink-0" />
                        <span className="truncate">{suggestion}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onActionRequest={handleActionRequest}
                    />
                  ))}
                  
                  {/* Typing/Processing Indicator */}
                  {isSending && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <AgentIndicator agentType={currentAgent} isProcessing />
                        <div className="flex items-center gap-1 mt-2">
                          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-muted/20">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your project..."
                  className="min-h-[44px] max-h-32 resize-none"
                  disabled={isSending || !projectId}
                />
                <Button
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  onClick={handleSend}
                  disabled={!input.trim() || isSending || !projectId}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {!projectId && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Select a project to start chatting
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Confirmation Dialog */}
      <ActionConfirmDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
        action={pendingAction}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
        isLoading={isActionLoading}
      />
    </>
  );
}
