// Data Validation types for spreadsheet cells

export interface ValidationRule {
    id: string;
    range: {
        startRow: number;
        endRow: number;
        startCol: number;
        endCol: number;
    };
    type: 'number' | 'list' | 'date' | 'text' | 'formula';
    criteria: {
        // Number validation
        min?: number;
        max?: number;

        // List validation
        list?: string[];

        // Date validation
        startDate?: string;
        endDate?: string;

        // Text validation
        minLength?: number;
        maxLength?: number;
        pattern?: string; // regex

        // Custom formula
        formula?: string;
    };
    errorMessage?: string;
    inputHelp?: string;
    allowBlank?: boolean;
    showDropdown?: boolean; // For list type
}

export interface ValidationError {
    row: number;
    col: number;
    message: string;
    rule: ValidationRule;
}

export function validateCell(
    value: string | number | null,
    row: number,
    col: number,
    rules: ValidationRule[]
): ValidationError | null {
    // Find applicable rule for this cell
    const rule = rules.find(r =>
        row >= r.range.startRow && row <= r.range.endRow &&
        col >= r.range.startCol && col <= r.range.endCol
    );

    if (!rule) return null;

    // Allow blank if configured
    if (rule.allowBlank && (value === null || value === '')) {
        return null;
    }

    // Validate based on type
    switch (rule.type) {
        case 'number': {
            const num = typeof value === 'number' ? value : parseFloat(String(value));
            if (isNaN(num)) {
                return {
                    row,
                    col,
                    message: rule.errorMessage || 'Please enter a valid number',
                    rule
                };
            }
            if (rule.criteria.min !== undefined && num < rule.criteria.min) {
                return {
                    row,
                    col,
                    message: rule.errorMessage || `Value must be >= ${rule.criteria.min}`,
                    rule
                };
            }
            if (rule.criteria.max !== undefined && num > rule.criteria.max) {
                return {
                    row,
                    col,
                    message: rule.errorMessage || `Value must be <= ${rule.criteria.max}`,
                    rule
                };
            }
            break;
        }

        case 'list': {
            if (!rule.criteria.list) return null;
            const strValue = String(value);
            if (!rule.criteria.list.includes(strValue)) {
                return {
                    row,
                    col,
                    message: rule.errorMessage || `Please select a value from the list`,
                    rule
                };
            }
            break;
        }

        case 'date': {
            const date = new Date(String(value));
            if (isNaN(date.getTime())) {
                return {
                    row,
                    col,
                    message: rule.errorMessage || 'Please enter a valid date',
                    rule
                };
            }
            if (rule.criteria.startDate) {
                const start = new Date(rule.criteria.startDate);
                if (date < start) {
                    return {
                        row,
                        col,
                        message: rule.errorMessage || `Date must be after ${rule.criteria.startDate}`,
                        rule
                    };
                }
            }
            if (rule.criteria.endDate) {
                const end = new Date(rule.criteria.endDate);
                if (date > end) {
                    return {
                        row,
                        col,
                        message: rule.errorMessage || `Date must be before ${rule.criteria.endDate}`,
                        rule
                    };
                }
            }
            break;
        }

        case 'text': {
            const strValue = String(value);
            if (rule.criteria.minLength && strValue.length < rule.criteria.minLength) {
                return {
                    row,
                    col,
                    message: rule.errorMessage || `Text must be at least ${rule.criteria.minLength} characters`,
                    rule
                };
            }
            if (rule.criteria.maxLength && strValue.length > rule.criteria.maxLength) {
                return {
                    row,
                    col,
                    message: rule.errorMessage || `Text must be at most ${rule.criteria.maxLength} characters`,
                    rule
                };
            }
            if (rule.criteria.pattern) {
                const regex = new RegExp(rule.criteria.pattern);
                if (!regex.test(strValue)) {
                    return {
                        row,
                        col,
                        message: rule.errorMessage || 'Text does not match required pattern',
                        rule
                    };
                }
            }
            break;
        }

        case 'formula': {
            // Formula validation would require formula evaluation
            // Defer to future implementation
            return null;
        }
    }

    return null;
}

// Helper to get rule for a specific cell
export function getRuleForCell(
    row: number,
    col: number,
    rules: ValidationRule[]
): ValidationRule | null {
    return rules.find(r =>
        row >= r.range.startRow && row <= r.range.endRow &&
        col >= r.range.startCol && col <= r.range.endCol
    ) || null;
}
