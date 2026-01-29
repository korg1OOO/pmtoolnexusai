import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { addDays, addWeeks, addMonths, format, isBefore, parseISO } from 'date-fns';
import type { 
  AIEnhancedMeeting,
  ExtractedDecision,
  ExtractedActionItem,
  ExtractedRisk,
  ExtractedScopeChange,
  ExtractedConflict,
  StakeholderRole,
  MoMTemplate,
} from '@/types/ai-pm';

// Helper function to generate recurring meeting instances
function generateRecurringInstances(
  input: CreateMeetingInput,
  parentId: string
): Omit<CreateMeetingInput, 'recurring_schedule' | 'recurring_end_date'>[] {
  const instances: Omit<CreateMeetingInput, 'recurring_schedule' | 'recurring_end_date'>[] = [];
  
  if (!input.recurring_schedule || input.recurring_schedule === 'none') {
    return instances;
  }

  const startDate = parseISO(input.date);
  const endDate = input.recurring_end_date 
    ? parseISO(input.recurring_end_date) 
    : addMonths(startDate, 3); // Default to 3 months if no end date

  let currentDate = startDate;
  const maxInstances = 52; // Safety limit: max 52 instances (1 year of weekly)
  let count = 0;

  // Skip the first date (it's the parent meeting)
  switch (input.recurring_schedule) {
    case 'daily':
      currentDate = addDays(currentDate, 1);
      break;
    case 'weekly':
      currentDate = addWeeks(currentDate, 1);
      break;
    case 'bi-weekly':
      currentDate = addWeeks(currentDate, 2);
      break;
    case 'monthly':
      currentDate = addMonths(currentDate, 1);
      break;
  }

  while (isBefore(currentDate, endDate) && count < maxInstances) {
    const instanceDate = format(currentDate, 'yyyy-MM-dd');
    
    instances.push({
      project_id: input.project_id,
      title: input.title,
      description: input.description,
      meeting_type: input.meeting_type,
      date: instanceDate,
      start_time: input.start_time,
      end_time: input.end_time,
      status: 'scheduled',
      source_type: input.source_type,
      meeting_link: input.meeting_link,
      location: input.location,
      purpose_type: input.purpose_type,
      purpose_description: input.purpose_description,
      expected_outcomes: input.expected_outcomes,
      success_criteria: input.success_criteria,
      recurring_parent_id: parentId,
      recurring_instance_date: instanceDate,
    });

    // Advance to next occurrence
    switch (input.recurring_schedule) {
      case 'daily':
        currentDate = addDays(currentDate, 1);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, 1);
        break;
      case 'bi-weekly':
        currentDate = addWeeks(currentDate, 2);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, 1);
        break;
    }
    
    count++;
  }

  return instances;
}
// Database types
export interface DbMeeting {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  meeting_type: 'online' | 'in-person' | 'offline';
  date: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  source_type: 'zoom' | 'teams' | 'meet' | 'audio' | 'manual';
  meeting_link: string | null;
  location: string | null;
  purpose_type: string;
  purpose_description: string | null;
  expected_outcomes: string[];
  success_criteria: string[];
  decision_scope_type: string;
  budget_authority: number | null;
  resource_authority: boolean;
  scope_change_authority: boolean;
  required_quorum: number;
  capture_mode: string;
  audio_available: boolean;
  video_available: boolean;
  transcript_available: boolean;
  recording_url: string | null;
  transcript_text: string | null;
  capture_confidence: 'high' | 'medium' | 'low';
  ai_summary: string | null;
  ai_confidence: number;
  ai_processed_at: string | null;
  ai_sentiment: Record<string, unknown> | null;
  ai_key_topics: unknown[];
  ai_next_steps: string[];
  mom_template_id: string | null;
  mom_generated: boolean;
  mom_content: string | null;
  mom_approved: boolean;
  linked_workstreams: string[];
  linked_risks: unknown[];
  // Recurring meeting fields
  recurring_schedule: 'none' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | null;
  recurring_end_date: string | null;
  recurring_parent_id: string | null;
  recurring_instance_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  role: string;
  power_level: string;
  interest_level: string;
  attendance_status: string;
  attended: boolean;
  join_time: string | null;
  leave_time: string | null;
  speaking_time_seconds: number;
  created_at: string;
}

export interface DbMeetingAgendaItem {
  id: string;
  meeting_id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  presenter_id: string | null;
  presenter_name: string | null;
  sort_order: number;
  status: string;
  actual_duration_minutes: number | null;
  notes: string | null;
  created_at: string;
}

export interface DbMeetingDecision {
  id: string;
  meeting_id: string;
  description: string;
  decision_type: string;
  made_by: string | null;
  made_by_user_id: string | null;
  approved_by: unknown[];
  impact: string;
  linked_risks: unknown[];
  linked_tasks: unknown[];
  timestamp_in_meeting: string | null;
  source: string;
  ai_confidence: number;
  implemented: boolean;
  implemented_at: string | null;
  created_at: string;
}

export interface DbMeetingActionItem {
  id: string;
  meeting_id: string;
  title: string;
  description: string | null;
  owner_name: string;
  owner_user_id: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  dependencies: unknown[];
  blocked_by: unknown[];
  source: string;
  ai_confidence: number;
  linked_task_id: string | null;
  completed_at: string | null;
  deferral_count: number;
  original_due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMeetingRisk {
  id: string;
  meeting_id: string;
  title: string;
  description: string | null;
  probability: string;
  impact: string;
  category: string | null;
  suggested_mitigation: string | null;
  source: string;
  ai_confidence: number;
  created_at: string;
}

export interface DbMeetingNote {
  id: string;
  meeting_id: string;
  user_id: string | null;
  user_email: string | null;
  content: string;
  note_type: string;
  timestamp_in_meeting: string | null;
  created_at: string;
}

export interface MeetingWithRelations extends DbMeeting {
  meeting_participants?: DbMeetingParticipant[];
  meeting_agenda_items?: DbMeetingAgendaItem[];
  meeting_decisions?: DbMeetingDecision[];
  meeting_action_items?: DbMeetingActionItem[];
  meeting_risks?: DbMeetingRisk[];
  meeting_notes?: DbMeetingNote[];
}

// Input types for creating/updating
export interface CreateMeetingInput {
  project_id?: string;
  title: string;
  description?: string;
  meeting_type?: 'online' | 'in-person' | 'offline';
  date: string;
  start_time: string;
  end_time?: string;
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  source_type?: 'zoom' | 'teams' | 'meet' | 'audio' | 'manual';
  meeting_link?: string;
  location?: string;
  purpose_type?: string;
  purpose_description?: string;
  expected_outcomes?: string[];
  success_criteria?: string[];
  decision_scope_type?: string;
  budget_authority?: number;
  resource_authority?: boolean;
  scope_change_authority?: boolean;
  required_quorum?: number;
  capture_mode?: string;
  // Recurring meeting fields
  recurring_schedule?: 'none' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  recurring_end_date?: string;
  recurring_parent_id?: string;
  recurring_instance_date?: string;
}

export interface CreateAgendaItemInput {
  meeting_id: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  presenter_name?: string;
  sort_order?: number;
}

export interface CreateParticipantInput {
  meeting_id: string;
  name: string;
  email?: string;
  role?: string;
  power_level?: string;
  interest_level?: string;
}

export interface CreateDecisionInput {
  meeting_id: string;
  description: string;
  decision_type?: string;
  made_by?: string;
  impact?: string;
  timestamp_in_meeting?: string;
}

export interface CreateActionItemInput {
  meeting_id: string;
  title: string;
  description?: string;
  owner_name: string;
  due_date?: string;
  priority?: string;
}

export interface CreateNoteInput {
  meeting_id: string;
  content: string;
  note_type?: string;
  timestamp_in_meeting?: string;
}

export function useMeetings(projectId?: string | null) {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<MeetingWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all meetings for project
  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('meetings')
        .select(`
          *,
          meeting_participants (*),
          meeting_agenda_items (*),
          meeting_decisions (*),
          meeting_action_items (*),
          meeting_risks (*)
        `)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setMeetings((data as MeetingWithRelations[]) || []);
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError('Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Initial fetch
  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('meetings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings' },
        () => fetchMeetings()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_action_items' },
        () => fetchMeetings()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_decisions' },
        () => fetchMeetings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMeetings]);

  // Create meeting (with recurring instance generation)
  const createMeeting = useCallback(
    async (input: CreateMeetingInput): Promise<DbMeeting | null> => {
      if (!user) {
        toast.error('You must be logged in to create a meeting');
        return null;
      }

      try {
        // Create the parent meeting
        const { data: parentMeeting, error: insertError } = await supabase
          .from('meetings')
          .insert({
            ...input,
            recurring_schedule: input.recurring_schedule === 'none' ? null : input.recurring_schedule,
            created_by: user.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Generate recurring instances if applicable
        if (input.recurring_schedule && input.recurring_schedule !== 'none') {
          const instances = generateRecurringInstances(input, parentMeeting.id);
          
          if (instances.length > 0) {
            const { error: instancesError } = await supabase
              .from('meetings')
              .insert(instances.map(inst => ({
                ...inst,
                created_by: user.id,
              })));
            
            if (instancesError) {
              console.error('Error creating recurring instances:', instancesError);
              // Don't fail the whole operation, just log the error
            } else {
              toast.success(`Created meeting with ${instances.length} recurring instances`);
              fetchMeetings();
              return parentMeeting as DbMeeting;
            }
          }
        }

        toast.success('Meeting created successfully');
        fetchMeetings();
        return parentMeeting as DbMeeting;
      } catch (err) {
        console.error('Error creating meeting:', err);
        toast.error('Failed to create meeting');
        return null;
      }
    },
    [user, fetchMeetings]
  );

  // Update meeting
  const updateMeeting = useCallback(
    async (id: string, updates: Partial<CreateMeetingInput>): Promise<boolean> => {
      try {
        const { error: updateError } = await supabase
          .from('meetings')
          .update(updates)
          .eq('id', id);

        if (updateError) throw updateError;

        toast.success('Meeting updated');
        fetchMeetings();
        return true;
      } catch (err) {
        console.error('Error updating meeting:', err);
        toast.error('Failed to update meeting');
        return false;
      }
    },
    [fetchMeetings]
  );

  // Delete meeting
  const deleteMeeting = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase
          .from('meetings')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        toast.success('Meeting deleted');
        fetchMeetings();
        return true;
      } catch (err) {
        console.error('Error deleting meeting:', err);
        toast.error('Failed to delete meeting');
        return false;
      }
    },
    [fetchMeetings]
  );

  // Add participant
  const addParticipant = useCallback(
    async (input: CreateParticipantInput): Promise<boolean> => {
      try {
        const { error: insertError } = await supabase
          .from('meeting_participants')
          .insert(input);

        if (insertError) throw insertError;

        fetchMeetings();
        return true;
      } catch (err) {
        console.error('Error adding participant:', err);
        toast.error('Failed to add participant');
        return false;
      }
    },
    [fetchMeetings]
  );

  // Add agenda item
  const addAgendaItem = useCallback(
    async (input: CreateAgendaItemInput): Promise<boolean> => {
      try {
        const { error: insertError } = await supabase
          .from('meeting_agenda_items')
          .insert(input);

        if (insertError) throw insertError;

        fetchMeetings();
        return true;
      } catch (err) {
        console.error('Error adding agenda item:', err);
        toast.error('Failed to add agenda item');
        return false;
      }
    },
    [fetchMeetings]
  );

  // Add decision
  const addDecision = useCallback(
    async (input: CreateDecisionInput): Promise<boolean> => {
      try {
        const { error: insertError } = await supabase
          .from('meeting_decisions')
          .insert({ ...input, source: 'manual' });

        if (insertError) throw insertError;

        toast.success('Decision recorded');
        fetchMeetings();
        return true;
      } catch (err) {
        console.error('Error adding decision:', err);
        toast.error('Failed to add decision');
        return false;
      }
    },
    [fetchMeetings]
  );

  // Add action item
  const addActionItem = useCallback(
    async (input: CreateActionItemInput): Promise<boolean> => {
      try {
        const { error: insertError } = await supabase
          .from('meeting_action_items')
          .insert({ ...input, source: 'manual' });

        if (insertError) throw insertError;

        toast.success('Action item added');
        fetchMeetings();
        return true;
      } catch (err) {
        console.error('Error adding action item:', err);
        toast.error('Failed to add action item');
        return false;
      }
    },
    [fetchMeetings]
  );

  // Update action item status
  const updateActionItemStatus = useCallback(
    async (id: string, status: string): Promise<boolean> => {
      try {
        const updates: Record<string, unknown> = { status };
        if (status === 'completed') {
          updates.completed_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from('meeting_action_items')
          .update(updates)
          .eq('id', id);

        if (updateError) throw updateError;

        toast.success('Action item updated');
        fetchMeetings();
        return true;
      } catch (err) {
        console.error('Error updating action item:', err);
        toast.error('Failed to update action item');
        return false;
      }
    },
    [fetchMeetings]
  );

  // Add note
  const addNote = useCallback(
    async (input: CreateNoteInput): Promise<boolean> => {
      if (!user) return false;

      try {
        const { error: insertError } = await supabase
          .from('meeting_notes')
          .insert({
            ...input,
            user_id: user.id,
            user_email: user.email,
          });

        if (insertError) throw insertError;

        fetchMeetings();
        return true;
      } catch (err) {
        console.error('Error adding note:', err);
        toast.error('Failed to add note');
        return false;
      }
    },
    [user, fetchMeetings]
  );

  // Process meeting with AI
  const processWithAI = useCallback(
    async (meetingId: string): Promise<boolean> => {
      try {
        const response = await supabase.functions.invoke('meeting-ai-extract', {
          body: { meetingId },
        });

        if (response.error) throw response.error;

        toast.success('AI processing complete');
        fetchMeetings();
        return true;
      } catch (err) {
        console.error('Error processing with AI:', err);
        toast.error('Failed to process meeting with AI');
        return false;
      }
    },
    [fetchMeetings]
  );

  // Generate Minutes of Meeting
  const generateMoM = useCallback(
    async (meetingId: string, templateId?: string): Promise<string | null> => {
      try {
        const response = await supabase.functions.invoke('meeting-generate-mom', {
          body: { meetingId, templateId },
        });

        if (response.error) throw response.error;

        toast.success('Minutes of Meeting generated');
        fetchMeetings();
        return response.data?.content || null;
      } catch (err) {
        console.error('Error generating MoM:', err);
        toast.error('Failed to generate Minutes of Meeting');
        return null;
      }
    },
    [fetchMeetings]
  );

  // Get single meeting by ID
  const getMeeting = useCallback(
    (id: string): MeetingWithRelations | undefined => {
      return meetings.find((m) => m.id === id);
    },
    [meetings]
  );

  // Get upcoming meetings
  const upcomingMeetings = meetings.filter(
    (m) => m.status === 'scheduled' && new Date(m.date) >= new Date()
  );

  // Get past meetings
  const pastMeetings = meetings.filter(
    (m) => m.status === 'completed' || new Date(m.date) < new Date()
  );

  // Get overdue action items
  const overdueActionItems = meetings.flatMap((m) =>
    (m.meeting_action_items || []).filter(
      (a) =>
        a.status !== 'completed' &&
        a.status !== 'cancelled' &&
        a.due_date &&
        new Date(a.due_date) < new Date()
    )
  );

  return {
    meetings,
    upcomingMeetings,
    pastMeetings,
    overdueActionItems,
    isLoading,
    error,
    fetchMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    addParticipant,
    addAgendaItem,
    addDecision,
    addActionItem,
    updateActionItemStatus,
    addNote,
    processWithAI,
    generateMoM,
    getMeeting,
  };
}
