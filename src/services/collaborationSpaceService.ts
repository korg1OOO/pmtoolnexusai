import { supabase } from '@/integrations/supabase/client';

export interface CollaborationSpace {
    id: string;
    program_id: string;
    name: string;
    description?: string;
    purpose?: string;
    project_ids: string[];
    status: 'active' | 'archived' | 'completed';
    created_at: string;
    updated_at: string;
    created_by_user_id: string;
}

export interface CollaborationSpaceMember {
    id: string;
    space_id: string;
    user_id: string;
    project_id?: string;
    role: 'owner' | 'moderator' | 'member';
    joined_at: string;
    added_by_user_id?: string;
}

// Space management
export async function getCollaborationSpaces(programId: string): Promise<CollaborationSpace[]> {
    const { data, error } = await supabase
        .from('collaboration_spaces')
        .select('*')
        .eq('program_id', programId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getActiveCollaborationSpaces(programId: string): Promise<CollaborationSpace[]> {
    const { data, error } = await supabase
        .from('collaboration_spaces')
        .select('*')
        .eq('program_id', programId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getCollaborationSpace(spaceId: string): Promise<CollaborationSpace> {
    const { data, error } = await supabase
        .from('collaboration_spaces')
        .select('*')
        .eq('id', spaceId)
        .single();

    if (error) throw error;
    return data;
}

export async function createCollaborationSpace(space: Partial<CollaborationSpace>): Promise<CollaborationSpace> {
    const { data, error } = await supabase
        .from('collaboration_spaces')
        .insert(space)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateCollaborationSpace(spaceId: string, updates: Partial<CollaborationSpace>): Promise<CollaborationSpace> {
    const { data, error } = await supabase
        .from('collaboration_spaces')
        .update(updates)
        .eq('id', spaceId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function archiveCollaborationSpace(spaceId: string): Promise<CollaborationSpace> {
    return updateCollaborationSpace(spaceId, { status: 'archived' });
}

export async function completeCollaborationSpace(spaceId: string): Promise<CollaborationSpace> {
    return updateCollaborationSpace(spaceId, { status: 'completed' });
}

// Members
export async function getSpaceMembers(spaceId: string): Promise<CollaborationSpaceMember[]> {
    const { data, error } = await supabase
        .from('collaboration_space_members')
        .select('*')
        .eq('space_id', spaceId)
        .order('joined_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function addSpaceMember(
    spaceId: string,
    userId: string,
    projectId?: string,
    role: 'owner' | 'moderator' | 'member' = 'member'
): Promise<CollaborationSpaceMember> {
    const { data, error } = await supabase
        .from('collaboration_space_members')
        .insert({
            space_id: spaceId,
            user_id: userId,
            project_id: projectId,
            role
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function removeSpaceMember(spaceId: string, userId: string): Promise<void> {
    const { error } = await supabase
        .from('collaboration_space_members')
        .delete()
        .eq('space_id', spaceId)
        .eq('user_id', userId);

    if (error) throw error;
}

export async function updateSpaceMemberRole(
    spaceId: string,
    userId: string,
    role: 'owner' | 'moderator' | 'member'
): Promise<CollaborationSpaceMember> {
    const { data, error } = await supabase
        .from('collaboration_space_members')
        .update({ role })
        .eq('space_id', spaceId)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Activities
export async function getSpaceDocuments(spaceId: string): Promise<any[]> {
    // Get the space to find project IDs
    const space = await getCollaborationSpace(spaceId);

    // Get documents from all projects in the space
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .in('project_id', space.project_ids)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) throw error;
    return data || [];
}

export async function getSpaceMeetings(spaceId: string): Promise<any[]> {
    // Get the space to find project IDs
    const space = await getCollaborationSpace(spaceId);

    // Get meetings from all projects in the space
    const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .in('project_id', space.project_ids)
        .order('date', { ascending: false })
        .limit(50);

    if (error) throw error;
    return data || [];
}

export async function getSpaceTasks(spaceId: string): Promise<any[]> {
    // Get the space to find project IDs
    const space = await getCollaborationSpace(spaceId);

    // Get tasks from all projects in the space
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .in('project_id', space.project_ids)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) throw error;
    return data || [];
}

// Statistics
export async function getSpaceStats(spaceId: string): Promise<{
    member_count: number;
    project_count: number;
    document_count: number;
    meeting_count: number;
    task_count: number;
}> {
    const space = await getCollaborationSpace(spaceId);

    // Get member count
    const { count: memberCount } = await supabase
        .from('collaboration_space_members')
        .select('*', { count: 'exact', head: true })
        .eq('space_id', spaceId);

    // Get document count
    const { count: documentCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .in('project_id', space.project_ids);

    // Get meeting count
    const { count: meetingCount } = await supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true })
        .in('project_id', space.project_ids);

    // Get task count
    const { count: taskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('project_id', space.project_ids);

    return {
        member_count: memberCount || 0,
        project_count: space.project_ids.length,
        document_count: documentCount || 0,
        meeting_count: meetingCount || 0,
        task_count: taskCount || 0
    };
}

// Search
export async function searchCollaborationSpaces(
    programId: string,
    query: string
): Promise<CollaborationSpace[]> {
    const { data, error } = await supabase
        .from('collaboration_spaces')
        .select('*')
        .eq('program_id', programId)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,purpose.ilike.%${query}%`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}
