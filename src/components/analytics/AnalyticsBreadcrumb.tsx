/**
 * Analytics Breadcrumb Component
 * Provides breadcrumb navigation for analytics drill-down paths
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
    label: string;
    path?: string;
    icon?: React.ComponentType<{ className?: string }>;
}

interface AnalyticsBreadcrumbProps {
    items: BreadcrumbItem[];
}

export function AnalyticsBreadcrumb({ items }: AnalyticsBreadcrumbProps) {
    const navigate = useNavigate();

    const handleClick = (path?: string) => {
        if (path) {
            navigate(path);
        }
    };

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                aria-label="Home"
            >
                <Home className="h-4 w-4" />
            </button>

            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const Icon = item.icon;

                return (
                    <React.Fragment key={index}>
                        <ChevronRight className="h-4 w-4" />
                        {item.path && !isLast ? (
                            <button
                                onClick={() => handleClick(item.path)}
                                className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                                {Icon && <Icon className="h-4 w-4" />}
                                {item.label}
                            </button>
                        ) : (
                            <span className={`flex items-center gap-1 ${isLast ? 'text-foreground font-medium' : ''}`}>
                                {Icon && <Icon className="h-4 w-4" />}
                                {item.label}
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}
