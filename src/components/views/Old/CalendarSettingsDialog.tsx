import React, { useState } from 'react';
import { useProjectCalendars } from '@/hooks/useProjectCalendars';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Calendar as CalendarIcon, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface CalendarSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CalendarSettingsDialog({ open, onOpenChange }: CalendarSettingsDialogProps) {
    const {
        calendars,
        isLoading,
        createCalendar,
        updateCalendar,
        deleteCalendar,
        getExceptionsQuery,
        createException,
        deleteException
    } = useProjectCalendars();

    const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
    const [newCalendarName, setNewCalendarName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Exceptions State
    const [newExceptionName, setNewExceptionName] = useState("");
    const [newExceptionStart, setNewExceptionStart] = useState<Date | undefined>(undefined);
    const [newExceptionEnd, setNewExceptionEnd] = useState<Date | undefined>(undefined);

    const selectedCalendar = calendars.find(c => c.id === selectedCalendarId);

    // Fetch exceptions for selected calendar
    const exceptionsQuery = useQuery(getExceptionsQuery(selectedCalendarId || ""));
    const exceptions = exceptionsQuery.data || [];

    const handleCreateCalendar = async () => {
        if (!newCalendarName) return;
        try {
            const newCal = await createCalendar({
                name: newCalendarName,
                isBaseCalendar: false
            });
            setSelectedCalendarId(newCal.id);
            setIsCreating(false);
            setNewCalendarName("");
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddException = async () => {
        if (!selectedCalendarId || !newExceptionName || !newExceptionStart || !newExceptionEnd) return;
        try {
            await createException({
                calendarId: selectedCalendarId,
                data: {
                    name: newExceptionName,
                    startDate: newExceptionStart,
                    endDate: newExceptionEnd,
                    isWorkingTime: false
                }
            });
            setNewExceptionName("");
            setNewExceptionStart(undefined);
            setNewExceptionEnd(undefined);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[600px] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 border-b">
                    <DialogTitle>Change Working Time</DialogTitle>
                    <DialogDescription>
                        Manage project calendars, working days, and exceptions (bank holidays, etc.).
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar: Calendar List */}
                    <div className="w-64 border-r bg-muted/30 flex flex-col">
                        <div className="p-4 border-b">
                            {isCreating ? (
                                <div className="flex flex-col gap-2">
                                    <Input
                                        value={newCalendarName}
                                        onChange={e => setNewCalendarName(e.target.value)}
                                        placeholder="Calendar Name"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={handleCreateCalendar}>Save</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <Button className="w-full" variant="outline" onClick={() => setIsCreating(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> Create New
                                </Button>
                            )}
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="flex flex-col p-2 gap-1">
                                {isLoading && <div className="text-sm text-center p-4 text-muted-foreground">Loading...</div>}
                                {calendars.map(cal => (
                                    <button
                                        key={cal.id}
                                        onClick={() => setSelectedCalendarId(cal.id)}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors text-left",
                                            selectedCalendarId === cal.id
                                                ? "bg-primary text-primary-foreground"
                                                : "hover:bg-muted"
                                        )}
                                    >
                                        <span className="truncate font-medium">{cal.name}</span>
                                        {selectedCalendarId === cal.id && (
                                            <Trash2
                                                className="h-3 w-3 opacity-60 hover:opacity-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm("Delete this calendar?")) {
                                                        deleteCalendar(cal.id);
                                                        if (selectedCalendarId === cal.id) setSelectedCalendarId(null);
                                                    }
                                                }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col p-6 overflow-hidden">
                        {selectedCalendar ? (
                            <Tabs defaultValue="exceptions" className="flex-1 flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold">{selectedCalendar.name}</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Base Calendar: {selectedCalendar.isBaseCalendar ? 'Yes' : 'No'}
                                        </p>
                                    </div>
                                    {/* Could add editable name logic here */}
                                </div>

                                <TabsList>
                                    <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
                                    <TabsTrigger value="workWeeks">Work Weeks</TabsTrigger>
                                </TabsList>

                                <TabsContent value="exceptions" className="flex-1 flex flex-col mt-4 min-h-0">
                                    <div className="bg-card border rounded-md flex-1 flex flex-col">
                                        <div className="p-4 border-b flex gap-2 items-end bg-muted/20">
                                            <div className="grid gap-1.5">
                                                <Label>Name</Label>
                                                <Input
                                                    value={newExceptionName}
                                                    onChange={(e) => setNewExceptionName(e.target.value)}
                                                    placeholder="e.g. Christmas"
                                                    className="w-40"
                                                />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label>Start</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !newExceptionStart && "text-muted-foreground")}>
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {newExceptionStart ? format(newExceptionStart, "PP") : "Pick date"}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar mode="single" selected={newExceptionStart} onSelect={setNewExceptionStart} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label>Finish</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !newExceptionEnd && "text-muted-foreground")}>
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {newExceptionEnd ? format(newExceptionEnd, "PP") : "Pick date"}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar mode="single" selected={newExceptionEnd} onSelect={setNewExceptionEnd} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <Button onClick={handleAddException}>Add</Button>
                                        </div>

                                        <ScrollArea className="flex-1">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Start</TableHead>
                                                        <TableHead>Finish</TableHead>
                                                        <TableHead className="w-[50px]"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {exceptions.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                                                No exceptions defined.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        exceptions.map((ex: any) => (
                                                            <TableRow key={ex.id}>
                                                                <TableCell>{ex.name}</TableCell>
                                                                <TableCell>{format(new Date(ex.startDate), 'PP')}</TableCell>
                                                                <TableCell>{format(new Date(ex.endDate), 'PP')}</TableCell>
                                                                <TableCell>
                                                                    <Button variant="ghost" size="icon" onClick={() => deleteException({ calendarId: selectedCalendarId, exceptionId: ex.id })}>
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    </div>
                                </TabsContent>

                                <TabsContent value="workWeeks" className="flex-1 p-4 text-center text-muted-foreground">
                                    Default: Monday to Friday, 08:00 to 17:00 (8h work day).
                                    <br />
                                    <span className="text-xs italic">Advanced work weeks customization coming soon.</span>
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                Select or create a calendar to edit.
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-muted/10">
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
