import { useProjectContext } from '@/contexts/ProjectContext';
import { MeetingAnalyticsDashboard } from '@/components/analytics/MeetingAnalyticsDashboard';

export default function MeetingAnalyticsView() {
    const { settings } = useProjectContext();
    return (
        <div className="flex flex-col h-full overflow-auto">
            <MeetingAnalyticsDashboard programId={settings?.id || ''} />
        </div>
    );
}
