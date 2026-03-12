/**
 * Cost Optimization Component
 * Displays cost savings recommendations and model alternatives
 */

import React from 'react';
import { useCostOptimization } from '@/hooks/useCostOptimization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { TrendingDown, Lightbulb, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function CostOptimizationPanel() {
    const { data: report, isLoading } = useCostOptimization();

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5" />
                        Cost Optimization
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        Analyzing cost savings opportunities...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!report) return null;

    const getTradeoffBadge = (tradeoff: string) => {
        switch (tradeoff) {
            case 'minimal':
                return <Badge variant="outline" className="border-green-500 text-green-500">Minimal Impact</Badge>;
            case 'moderate':
                return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Moderate Impact</Badge>;
            case 'significant':
                return <Badge variant="outline" className="border-red-500 text-red-500">Significant Impact</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Summary Alert */}
            {report.potential_savings > 0 && (
                <Alert className="border-green-500 bg-green-50">
                    <TrendingDown className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                        <strong>Potential Savings: ${report.potential_savings.toFixed(2)}/month</strong>
                        {' '}({report.savings_percentage.toFixed(1)}% reduction)
                    </AlertDescription>
                </Alert>
            )}

            {/* Model Alternatives */}
            {report.model_alternatives.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5" />
                            Model Alternatives
                        </CardTitle>
                        <CardDescription>
                            Lower-cost models with similar performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Current Model</TableHead>
                                    <TableHead>Alternative</TableHead>
                                    <TableHead>Cost Comparison</TableHead>
                                    <TableHead>Monthly Savings</TableHead>
                                    <TableHead>Impact</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {report.model_alternatives.slice(0, 5).map((alt, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium capitalize">{alt.current_provider}</div>
                                                <div className="text-sm text-muted-foreground">{alt.current_model}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium capitalize">{alt.alternative_provider}</div>
                                                <div className="text-sm text-muted-foreground">{alt.alternative_model}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground line-through">
                                                        ${alt.current_cost_per_request.toFixed(4)}
                                                    </span>
                                                    <span className="text-sm font-medium text-green-600">
                                                        ${alt.alternative_cost_per_request.toFixed(4)}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    per request
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-bold text-green-600">
                                                    ${alt.potential_monthly_savings.toFixed(2)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {alt.savings_percentage.toFixed(1)}% savings
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getTradeoffBadge(alt.performance_tradeoff)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Usage Patterns */}
            {report.usage_patterns.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Usage Pattern Optimizations
                        </CardTitle>
                        <CardDescription>
                            Opportunities to improve efficiency
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {report.usage_patterns.map((pattern, idx) => (
                                <Card key={idx}>
                                    <CardContent className="pt-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold">{pattern.description}</h4>
                                                <Badge variant="outline" className="text-green-600 border-green-600">
                                                    ${pattern.savings.toFixed(2)} savings
                                                </Badge>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Current Cost:</span>
                                                    <span className="font-medium">${pattern.current_cost.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Optimized Cost:</span>
                                                    <span className="font-medium text-green-600">
                                                        ${pattern.optimized_cost.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mt-4">
                                                <div className="text-sm font-medium">Action Items:</div>
                                                <ul className="space-y-1">
                                                    {pattern.action_items.map((item, itemIdx) => (
                                                        <li key={itemIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                                                            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recommendations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        Recommendations
                    </CardTitle>
                    <CardDescription>
                        Action items to reduce AI costs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {report.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <div className="mt-0.5">
                                    {rec.startsWith('💡') && <span className="text-lg">💡</span>}
                                    {rec.startsWith('🔧') && <span className="text-lg">🔧</span>}
                                    {rec.startsWith('📊') && <span className="text-lg">📊</span>}
                                    {rec.startsWith('⚙️') && <span className="text-lg">⚙️</span>}
                                    {rec.startsWith('🎯') && <span className="text-lg">🎯</span>}
                                    {rec.startsWith('📈') && <span className="text-lg">📈</span>}
                                </div>
                                <span className="text-sm">{rec.substring(2)}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
