import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useProjectContext } from '@/contexts/ProjectContext';
import { supabase } from '@/integrations/supabase/client';

interface Project {
    id: string;
    name: string;
    code: string;
    methodology: string;
}

interface ProjectSwitcherProps {
    className?: string;
}

export function ProjectSwitcher({ className }: ProjectSwitcherProps) {
    const { settings, selectProject } = useProjectContext();
    const [open, setOpen] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
            const fetchProjects = async () => {
                const { data, error } = await supabase
                    .from('projects')
                    .select('id, name, code, methodology')
                    .order('name');

                if (!error && data) {
                    setProjects(data as Project[]);
                }
                setLoading(false);
            };

            fetchProjects();
        }
    }, [open]);

    const handleSelect = (projectId: string) => {
        selectProject(projectId);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-[250px] justify-between", className)}
                >
                    <div className="flex items-center gap-2 truncate">
                        <FolderKanban className="h-4 w-4 shrink-0 opacity-50" />
                        <div className="flex flex-col items-start text-xs text-left overflow-hidden">
                            <span className="font-medium truncate w-full">{settings.name || "Select Project..."}</span>
                            {settings.code && <span className="text-muted-foreground text-[10px]">{settings.code}</span>}
                        </div>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
                <Command>
                    <CommandInput placeholder="Search project..." />
                    <CommandList>
                        <CommandEmpty>No project found.</CommandEmpty>
                        <CommandGroup heading="Projects">
                            {projects.map((project) => (
                                <CommandItem
                                    key={project.id}
                                    value={project.name} // Search by name
                                    onSelect={() => handleSelect(project.id)}
                                    className="text-sm"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            settings.id === project.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{project.name}</span>
                                        <span className="text-xs text-muted-foreground">{project.code}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem onSelect={() => console.log("Create Project clicked")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Project
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
