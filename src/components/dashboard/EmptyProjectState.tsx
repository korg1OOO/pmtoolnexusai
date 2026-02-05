import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FolderPlus } from 'lucide-react';

interface EmptyProjectStateProps {
  onCreateProject: () => void;
}

export function EmptyProjectState({ onCreateProject }: EmptyProjectStateProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="max-w-md mx-auto">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <FolderPlus className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No Project Selected</h2>
          <p className="text-muted-foreground">
            Create a new project to get started with your project management.
          </p>
          <Button onClick={onCreateProject} className="mt-4">
            Create Project
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
