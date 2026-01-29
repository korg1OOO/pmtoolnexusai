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
  Sparkles,
  BarChart3,
  Lightbulb,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { PageContextPanel, getSuggestedQuestions, getViewContext } from './PageContextPanel';
import { IntentModeToggle, type IntentMode } from './IntentModeToggle';
import { ClarifyingQuestion, type ClarifyingQuestionData } from './ClarifyingQuestion';
import { ROLE_DISPLAY_NAMES, type ProjectRole, type AIAction } from '@/types/ai-agents';
import { toast } from 'sonner';

interface GlobalAISidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  projectId: string | null;
  projectName?: string;
  currentView?: string;
}

export function GlobalAISidebar({ 
  isOpen, 
  onToggle, 
  projectId,
  projectName = 'Current Project',
  currentView = 'dashboard'
}: GlobalAISidebarProps) {
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [pendingAction, setPendingAction] = useState<AIAction | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [intentMode, setIntentMode] = useState<IntentMode>('plan');
  const [clarifyingQuestion, setClarifyingQuestion] = useState<ClarifyingQuestionData | null>(null);
  const [showContext, setShowContext] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: userRole = 'viewer' } = useUserRole(projectId);
  const viewContext = getViewContext(currentView);
  const suggestedQuestions = getSuggestedQuestions(currentView);
  
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
  } = useAIChat({ projectId, currentView, intentMode });

  // Handle action confirmation from chat messages
  const handleActionRequest = useCallback((action: AIAction) => {
    setPendingAction(action);
  }, []);

  const handleConfirmAction = useCallback(async () => {
    if (!pendingAction) return;
    
    setIsActionLoading(true);
    try {
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

  // Handle clarifying question answer
  const handleClarifyingAnswer = useCallback(async (questionId: string, selectedOptions: string[]) => {
    if (!clarifyingQuestion) return;
    
    const selectedLabels = clarifyingQuestion.options
      .filter(opt => selectedOptions.includes(opt.id))
      .map(opt => opt.label)
      .join(', ');
    
    await sendMessage(`My answer: ${selectedLabels}`);
    setClarifyingQuestion(null);
  }, [clarifyingQuestion, sendMessage]);

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

  // Hide context panel after first message
  useEffect(() => {
    if (messages.length > 0) {
      setShowContext(false);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const message = input;
    setInput('');
    
    // Include context in the message
    const contextPrefix = intentMode === 'plan' 
      ? '[Plan Mode] ' 
      : '[Action Mode] ';
    const viewPrefix = `[Context: ${viewContext.title}] `;
    
    await sendMessage(viewPrefix + contextPrefix + message);
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
    setShowContext(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    textareaRef.current?.focus();
  };

  const IconComponent = viewContext.icon;

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

            {/* Context Banner - Current View */}
            <div className="px-3 py-2 border-b bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="gap-1">
                  <IconComponent className="h-3 w-3" />
                  {viewContext.title}
                </Badge>
                <span className="text-muted-foreground text-xs">Active context</span>
              </div>
              <Badge variant="secondary" className="capitalize text-xs">
                {ROLE_DISPLAY_NAMES[userRole as ProjectRole] || userRole}
              </Badge>
            </div>

            {/* Intent Mode Toggle */}
            <div className="px-3 py-2 border-b flex items-center justify-center">
              <IntentModeToggle
                mode={intentMode}
                onChange={setIntentMode}
                disabled={isSending}
              />
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
                <div className="space-y-4">
                  {/* Page Context Panel */}
                  {showContext && (
                    <PageContextPanel currentView={currentView} />
                  )}

                  {/* Welcome Message */}
                  <div className="text-center px-2">
                    <div className="p-3 rounded-full bg-primary/10 inline-flex mb-3">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium mb-1 text-sm">How can I help you?</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {intentMode === 'plan' 
                        ? "I'll analyze and provide insights without making changes."
                        : "I'll help you make changes (with confirmation)."}
                    </p>
                  </div>

                  {/* Mode Indicator */}
                  <div className={cn(
                    "flex items-center gap-2 p-2 rounded-lg text-xs",
                    intentMode === 'plan' 
                      ? "bg-primary/10 text-primary"
                      : "bg-accent text-accent-foreground"
                  )}>
                    {intentMode === 'plan' ? (
                      <Lightbulb className="h-4 w-4" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    <span>
                      {intentMode === 'plan'
                        ? "Plan Mode: Ask questions, get insights, explore options"
                        : "Action Mode: Make changes to your project (requires confirmation)"}
                    </span>
                  </div>

                  <Separator className="my-3" />

                  {/* Context-specific suggested questions */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Suggested for {viewContext.title}:
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {suggestedQuestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          className="justify-start text-left h-auto py-2 px-3"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <ChevronRight className="h-3 w-3 mr-2 shrink-0 text-muted-foreground" />
                          <span className="text-xs truncate">{suggestion}</span>
                        </Button>
                      ))}
                    </div>
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
                  
                  {/* Clarifying Question */}
                  {clarifyingQuestion && (
                    <ClarifyingQuestion
                      question={clarifyingQuestion}
                      onAnswer={handleClarifyingAnswer}
                      onDismiss={() => setClarifyingQuestion(null)}
                      isLoading={isSending}
                    />
                  )}
                  
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
                  placeholder={
                    intentMode === 'plan'
                      ? "Ask a question about your project..."
                      : "What would you like me to do?"
                  }
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
