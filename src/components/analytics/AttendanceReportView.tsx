import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Users,
    TrendingUp,
    Calendar,
    Download,
    FileText,
    Table as TableIcon,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    getTopAttendees,
    getRSVPAnalytics,
    getAttendancePatterns
} from '@/services/meetingAnalyticsService';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceReportViewProps {
    programId: string;
}

export function AttendanceReportView({ programId }: AttendanceReportViewProps) {
    const [dateRange, setDateRange] = useState('30');
    const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');

    // Calculate date range
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

    // Fetch data
    const { data: topAttendees = [], isLoading: attendeesLoading } = useQuery({
        queryKey: ['top-attendees', programId, startDate, endDate],
        queryFn: () => getTopAttendees(programId, startDate, endDate, 20)
    });

    const { data: rsvpStats, isLoading: rsvpLoading } = useQuery({
        queryKey: ['rsvp-analytics', programId, startDate, endDate],
        queryFn: () => getRSVPAnalytics(programId, startDate, endDate)
    });

    // Fetch user details for top attendees
    const { data: userDetails = [] } = useQuery({
        queryKey: ['user-details', topAttendees],
        queryFn: async () => {
            if (topAttendees.length === 0) return [];

            const userIds = topAttendees.map(a => a.user_id);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);

            if (error) {
                console.error('Error fetching user details:', error);
                return [];
            }

            return data || [];
        },
        enabled: topAttendees.length > 0
    });

    // Merge attendee data with user details
    const attendeesWithDetails = topAttendees.map(attendee => {
        const user = userDetails.find(u => u.id === attendee.user_id);
        return {
            ...attendee,
            name: user?.full_name || 'Unknown User',
            email: user?.email || ''
        };
    });

    const handleExport = async () => {
        if (exportFormat === 'pdf') {
            await exportToPDF();
        } else {
            await exportToExcel();
        }
    };

    const exportToPDF = async () => {
        // Import jsPDF dynamically
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text('Attendance Report', 14, 20);

        // Date range
        doc.setFontSize(12);
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 30);

        // RSVP Summary
        doc.setFontSize(14);
        doc.text('RSVP Summary', 14, 45);
        doc.setFontSize(10);
        doc.text(`Total Invites: ${rsvpStats?.total_invites || 0}`, 14, 55);
        doc.text(`Accepted: ${rsvpStats?.accepted || 0}`, 14, 62);
        doc.text(`Declined: ${rsvpStats?.declined || 0}`, 14, 69);
        doc.text(`Tentative: ${rsvpStats?.tentative || 0}`, 14, 76);
        doc.text(`No Response: ${rsvpStats?.no_response || 0}`, 14, 83);

        // Top Attendees
        doc.setFontSize(14);
        doc.text('Top Attendees', 14, 100);
        doc.setFontSize(10);

        let y = 110;
        attendeesWithDetails.slice(0, 15).forEach((attendee, index) => {
            doc.text(
                `${index + 1}. ${attendee.name} - ${attendee.attendance_count} meetings (${attendee.attendance_rate.toFixed(1)}%)`,
                14,
                y
            );
            y += 7;
        });

        // Save
        doc.save(`attendance-report-${startDate}-to-${endDate}.pdf`);
    };

    const exportToExcel = async () => {
        // Import xlsx dynamically
        const XLSX = await import('xlsx');

        // Prepare data
        const attendeeData = attendeesWithDetails.map((a, index) => ({
            Rank: index + 1,
            Name: a.name,
            Email: a.email,
            'Meetings Attended': a.attendance_count,
            'Attendance Rate': `${a.attendance_rate.toFixed(1)}%`
        }));

        const rsvpData = [
            { Metric: 'Total Invites', Value: rsvpStats?.total_invites || 0 },
            { Metric: 'Accepted', Value: rsvpStats?.accepted || 0 },
            { Metric: 'Declined', Value: rsvpStats?.declined || 0 },
            { Metric: 'Tentative', Value: rsvpStats?.tentative || 0 },
            { Metric: 'No Response', Value: rsvpStats?.no_response || 0 }
        ];

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Add sheets
        const ws1 = XLSX.utils.json_to_sheet(rsvpData);
        const ws2 = XLSX.utils.json_to_sheet(attendeeData);

        XLSX.utils.book_append_sheet(wb, ws1, 'RSVP Summary');
        XLSX.utils.book_append_sheet(wb, ws2, 'Top Attendees');

        // Save
        XLSX.writeFile(wb, `attendance-report-${startDate}-to-${endDate}.xlsx`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Attendance Report</h2>
                    <p className="text-muted-foreground">
                        Detailed attendance patterns and participation metrics
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="180">Last 6 months</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'pdf' | 'excel')}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="excel">Excel</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* RSVP Summary Cards */}
            {rsvpStats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <SummaryCard
                        icon={Calendar}
                        label="Total Invites"
                        value={rsvpStats.total_invites}
                        color="blue"
                    />
                    <SummaryCard
                        icon={CheckCircle}
                        label="Accepted"
                        value={rsvpStats.accepted}
                        percentage={(rsvpStats.accepted / rsvpStats.total_invites) * 100}
                        color="green"
                    />
                    <SummaryCard
                        icon={XCircle}
                        label="Declined"
                        value={rsvpStats.declined}
                        percentage={(rsvpStats.declined / rsvpStats.total_invites) * 100}
                        color="red"
                    />
                    <SummaryCard
                        icon={Clock}
                        label="Tentative"
                        value={rsvpStats.tentative}
                        percentage={(rsvpStats.tentative / rsvpStats.total_invites) * 100}
                        color="yellow"
                    />
                    <SummaryCard
                        icon={Users}
                        label="No Response"
                        value={rsvpStats.no_response}
                        percentage={(rsvpStats.no_response / rsvpStats.total_invites) * 100}
                        color="gray"
                    />
                </div>
            )}

            {/* Top Attendees Table */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top Attendees</h3>
                {attendeesLoading ? (
                    <div className="text-center py-12 text-muted-foreground">
                        Loading attendance data...
                    </div>
                ) : attendeesWithDetails.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No attendance data available</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">Rank</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Meetings Attended</TableHead>
                                <TableHead className="text-right">Attendance Rate</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendeesWithDetails.map((attendee, index) => (
                                <TableRow key={attendee.user_id}>
                                    <TableCell className="font-medium">
                                        {index === 0 && '🥇'}
                                        {index === 1 && '🥈'}
                                        {index === 2 && '🥉'}
                                        {index > 2 && index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">{attendee.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{attendee.email}</TableCell>
                                    <TableCell className="text-right">{attendee.attendance_count}</TableCell>
                                    <TableCell className="text-right">
                                        <span className={`font-medium ${attendee.attendance_rate >= 80 ? 'text-green-600' :
                                                attendee.attendance_rate >= 60 ? 'text-yellow-600' :
                                                    'text-red-600'
                                            }`}>
                                            {attendee.attendance_rate.toFixed(1)}%
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}

// Summary Card Component
interface SummaryCardProps {
    icon: React.ElementType;
    label: string;
    value: number;
    percentage?: number;
    color: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
}

function SummaryCard({ icon: Icon, label, value, percentage, color }: SummaryCardProps) {
    const colorClasses = {
        blue: 'text-blue-500 bg-blue-100',
        green: 'text-green-500 bg-green-100',
        red: 'text-red-500 bg-red-100',
        yellow: 'text-yellow-500 bg-yellow-100',
        gray: 'text-gray-500 bg-gray-100'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border rounded-lg p-4"
        >
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <p className="text-sm text-muted-foreground">{label}</p>
            </div>
            <p className="text-2xl font-bold">{value}</p>
            {percentage !== undefined && !isNaN(percentage) && (
                <p className="text-xs text-muted-foreground mt-1">
                    {percentage.toFixed(1)}% of total
                </p>
            )}
        </motion.div>
    );
}
