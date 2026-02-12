import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Download, Loader2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { forecastCosts } from "@/services/mlAnalyticsService";
import type { CostForecast } from "@/types/mlAnalytics";
import { toast } from "sonner";

interface CostForecastingPanelProps {
    projectId: string;
}

export default function CostForecastingPanel({ projectId }: CostForecastingPanelProps) {
    const [forecast, setForecast] = useState<CostForecast | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confidenceScore, setConfidenceScore] = useState(0);
    const [timeframe, setTimeframe] = useState<'6month' | '12month' | 'project_end'>('project_end');
    const [fromCache, setFromCache] = useState(false);

    useEffect(() => {
        loadForecast();
    }, [projectId, timeframe]);

    const loadForecast = async () => {
        setIsLoading(true);
        setError(null);

        const response = await forecastCosts(projectId, { timeframe });

        if (response.error) {
            setError(response.error);
        } else if (response.data) {
            setForecast(response.data);
            setConfidenceScore(response.confidence_score);
            setFromCache(response.from_cache || false);
        }

        setIsLoading(false);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const handleExport = async () => {
        if (!forecast) return;

        try {
            const XLSX = await import('xlsx');
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            // Create workbook for Excel
            const wb = XLSX.utils.book_new();

            // Summary sheet
            const summaryData = [
                ['Cost Forecast Summary', ''],
                ['', ''],
                ['Total Budget', formatCurrency(forecast.total_budget)],
                ['Total Forecast', formatCurrency(forecast.total_forecast)],
                ['Variance', formatCurrency(forecast.total_variance)],
                ['Variance %', `${forecast.variance_percent.toFixed(1)}%`],
                ['Confidence Score', `${(confidenceScore * 100).toFixed(0)}%`],
                ['', ''],
                ['Timeline Data', ''],
                ['Date', 'Budget', 'Forecast', 'Actual'],
            ];

            forecast.timeline.forEach(t => {
                summaryData.push([
                    t.date,
                    t.budgeted?.toString() || '',
                    t.forecast?.toString() || '',
                    t.actual?.toString() || ''
                ]);
            });

            const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

            // Variance by category sheet
            const categoryData = [
                ['Category', 'Budgeted', 'Forecast', 'Variance', 'Variance %'],
                ...forecast.variance_by_category.map(c => [
                    c.category,
                    c.budgeted,
                    c.forecast,
                    c.variance,
                    c.variance_percent
                ])
            ];
            const categoryWs = XLSX.utils.aoa_to_sheet(categoryData);
            XLSX.utils.book_append_sheet(wb, categoryWs, 'Variance by Category');

            // Export Excel
            XLSX.writeFile(wb, `cost-forecast-${new Date().toISOString().split('T')[0]}.xlsx`);

            // Export PDF
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text('Cost Forecast Report', 14, 20);

            doc.setFontSize(11);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
            doc.text(`Confidence: ${(confidenceScore * 100).toFixed(0)}%`, 14, 36);

            // Summary table
            autoTable(doc, {
                startY: 45,
                head: [['Metric', 'Value']],
                body: [
                    ['Total Budget', formatCurrency(forecast.total_budget)],
                    ['Total Forecast', formatCurrency(forecast.total_forecast)],
                    ['Variance', formatCurrency(forecast.total_variance)],
                    ['Variance %', `${forecast.variance_percent.toFixed(1)}%`],
                ],
            });

            // Variance by category table
            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 10,
                head: [['Category', 'Budgeted', 'Forecast', 'Variance', 'Variance %']],
                body: forecast.variance_by_category.map(c => [
                    c.category,
                    formatCurrency(c.budgeted),
                    formatCurrency(c.forecast),
                    formatCurrency(c.variance),
                    `${c.variance_percent.toFixed(1)}%`
                ]),
            });

            doc.save(`cost-forecast-${new Date().toISOString().split('T')[0]}.pdf`);

            toast.success('Forecast exported successfully (Excel & PDF)');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export forecast data');
        }
    };

    if (isLoading) {
        return (
            <Card className="p-8">
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-muted-foreground">Forecasting costs...</p>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="p-8 border-red-200 bg-red-50">
                <div className="flex items-center gap-3 text-red-700">
                    <AlertTriangle className="h-6 w-6" />
                    <div>
                        <p className="font-semibold">Error loading cost forecast</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            </Card>
        );
    }

    if (!forecast) {
        return (
            <Card className="p-8">
                <p className="text-muted-foreground text-center">No cost forecast available</p>
            </Card>
        );
    }

    const isOverBudget = forecast.total_variance > 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-2xl font-bold">Cost Forecasting</h2>
                <div className="flex items-center gap-3">
                    {fromCache && (
                        <Badge variant="outline" className="text-xs">
                            Cached
                        </Badge>
                    )}
                    <Badge variant="secondary">
                        {(confidenceScore * 100).toFixed(0)}% Confidence
                    </Badge>
                    <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="6month">6 Months</SelectItem>
                            <SelectItem value="12month">12 Months</SelectItem>
                            <SelectItem value="project_end">Project End</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Budget vs Forecast Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <p className="text-sm font-medium">Total Budget</p>
                        </div>
                        <p className="text-3xl font-bold">{formatCurrency(forecast.total_budget)}</p>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className={`p-6 border-2 ${isOverBudget ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className={`h-4 w-4 ${isOverBudget ? 'text-orange-600' : 'text-green-600'}`} />
                            <p className="text-sm font-medium">Forecast Total</p>
                        </div>
                        <p className="text-3xl font-bold">{formatCurrency(forecast.total_forecast)}</p>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className={`p-6 ${isOverBudget ? 'bg-red-50' : 'bg-green-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-medium">Variance</p>
                        </div>
                        <p className={`text-3xl font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                            {isOverBudget ? '+' : ''}{formatCurrency(forecast.total_variance)}
                        </p>
                        <p className={`text-sm ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                            {isOverBudget ? '+' : ''}{forecast.variance_percent.toFixed(1)}%
                        </p>
                    </Card>
                </motion.div>
            </div>

            {/* Timeline Chart */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Cost Timeline</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={forecast.timeline}>
                        <defs>
                            <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="budgeted"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorBudget)"
                            name="Budget"
                        />
                        <Area
                            type="monotone"
                            dataKey="forecast"
                            stroke="#f59e0b"
                            fillOpacity={1}
                            fill="url(#colorForecast)"
                            name="Forecast"
                        />
                        {forecast.timeline.some(t => t.actual !== undefined) && (
                            <Area
                                type="monotone"
                                dataKey="actual"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorActual)"
                                name="Actual"
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </Card>

            {/* Variance Breakdown */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Variance by Category</h3>
                <div className="space-y-4">
                    {forecast.variance_by_category.map((category, index) => {
                        const isOver = category.variance > 0;
                        return (
                            <motion.div
                                key={category.category}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                            >
                                <div className="flex-1">
                                    <p className="font-medium">{category.category}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Budget: {formatCurrency(category.budgeted)} → Forecast: {formatCurrency(category.forecast)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                                        {isOver ? '+' : ''}{formatCurrency(category.variance)}
                                    </p>
                                    <p className={`text-sm ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                                        {isOver ? '+' : ''}{category.variance_percent.toFixed(1)}%
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </Card>

            {/* ML Insights */}
            <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    ML Insights
                </h3>
                {forecast.insights.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No insights available</p>
                ) : (
                    <ul className="space-y-2">
                        {forecast.insights.map((insight, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                                <span className="text-blue-600 font-bold">•</span>
                                <span>{insight}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}
