export interface BriefingAction {
    id: string;
    title: string;
    assignee: string;
    dueDate: string;
    status: 'open' | 'in-progress' | 'overdue' | 'completed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    source: string;
}

export interface BriefingDecision {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    impact: 'low' | 'medium' | 'high';
    date: string;
    owner: string;
}

export interface TeamMember {
    id: string;
    name: string;
    avatar?: string;
    role: string;
    status: 'available' | 'busy' | 'away' | 'offline';
    workload: number;
    tasksAssigned: number;
    hoursAllocated: number;
}

export interface BriefingRisk {
    id: string;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    probability: 'low' | 'medium' | 'high';
    status: 'active' | 'mitigated' | 'closed';
    owner?: string;
}
