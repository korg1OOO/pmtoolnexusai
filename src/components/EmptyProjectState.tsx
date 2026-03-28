import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FolderPlus, Rocket } from 'lucide-react';

interface EmptyProjectStateProps {
    onCreateProject: () => void;
}

export function EmptyProjectState({ onCreateProject }: EmptyProjectStateProps) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
            <Card className="w-full max-w-2xl shadow-xl">
                <CardContent className="pt-12 pb-12 text-center">
                    <div className="mb-8 flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
                            <Rocket className="relative h-24 w-24 text-primary" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Welcome to Kiroxys
                    </h1>

                    <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto">
                        Start your journey by creating your first project. Transform your ideas into actionable plans with powerful project management tools.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                        <Button
                            onClick={onCreateProject}
                            size="lg"
                            className="gap-2 text-lg px-8"
                        >
                            <FolderPlus className="h-5 w-5" />
                            Create Your First Project
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left">
                        <div className="p-6 rounded-lg bg-muted/30 border border-border">
                            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                <span className="text-2xl">📊</span>
                            </div>
                            <h3 className="font-semibold mb-2">Visualize Progress</h3>
                            <p className="text-sm text-muted-foreground">
                                Track tasks with Gantt charts, Kanban boards, and real-time dashboards
                            </p>
                        </div>

                        <div className="p-6 rounded-lg bg-muted/30 border border-border">
                            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                <span className="text-2xl">🤝</span>
                            </div>
                            <h3 className="font-semibold mb-2">Collaborate Seamlessly</h3>
                            <p className="text-sm text-muted-foreground">
                                Work together with real-time updates, meetings, and communication tools
                            </p>
                        </div>

                        <div className="p-6 rounded-lg bg-muted/30 border border-border">
                            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                <span className="text-2xl">🎯</span>
                            </div>
                            <h3 className="font-semibold mb-2">Deliver On Time</h3>
                            <p className="text-sm text-muted-foreground">
                                Manage risks, track issues, and ensure successful project delivery
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
