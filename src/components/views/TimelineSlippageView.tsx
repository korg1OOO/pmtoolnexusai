import { useProjectContext } from '@/contexts/ProjectContext';
import { TimelineSlippageDetail } from '@/components/analytics/TimelineSlippageDetail';

export default function TimelineSlippageView() {
    const { settings } = useProjectContext();
    return (
        <div className="flex flex-col h-full overflow-auto p-6">
            <TimelineSlippageDetail projectId={settings?.id || ''} />
        </div>
    );
}
