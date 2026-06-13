import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FolderPlus, Layers, ListTodo, GitBranch, ArrowRight } from 'lucide-react';

interface EmptyProjectStateProps {
    onCreateProject: () => void;
}

export function EmptyProjectState({ onCreateProject }: EmptyProjectStateProps) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background to-muted/20 p-6">
            <div className="w-full max-w-4xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                        <GitBranch className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-3">
                        Let's build your project together
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-md mx-auto">
                        Follow these simple stages. No overwhelm — just clear next steps.
                    </p>
                </div>

                {/* Staged Onboarding - Controlled in stages */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {/* Stage 1 */}
                    <Card className="border-2 border-primary/30 bg-card/50">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">1</div>
                                <div>
                                    <div className="font-semibold text-lg">Create Mega Project</div>
                                    <div className="text-xs text-muted-foreground">The root of everything</div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                Start with the big picture. Give your project a name, description and goals.
                            </p>
                            <Button 
                                onClick={onCreateProject} 
                                className="w-full gap-2"
                                size="lg"
                            >
                                <FolderPlus className="h-4 w-4" />
                                Create Mega Project
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Stage 2 */}
                    <Card className="border border-border bg-card/50">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-semibold">2</div>
                                <div>
                                    <div className="font-semibold text-lg">Add Modules</div>
                                    <div className="text-xs text-muted-foreground">Break it down</div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                Organize your work into Modules and Submodules. Unlimited nesting supported.
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Layers className="h-4 w-4" />
                                <span>Hierarchical structure</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stage 3 */}
                    <Card className="border border-border bg-card/50">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-semibold">3</div>
                                <div>
                                    <div className="font-semibold text-lg">Add Tasks + Visualize</div>
                                    <div className="text-xs text-muted-foreground">See it come alive</div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                Add tasks to any node. Then explore everything beautifully in the interactive Mind Map.
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ListTodo className="h-4 w-4" />
                                <span>Mind Map view</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom CTA */}
                <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                        You can always switch to <span className="font-medium text-foreground">Advanced mode</span> later for Gantt, Risks, Financials and more.
                    </p>
                    <Button 
                        variant="outline" 
                        onClick={onCreateProject}
                        className="gap-2"
                    >
                        Start with Stage 1 → Create Project
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
