// Formula evaluation engine for Excel-like formulas

export interface CellRef {
  col: number;
  row: number;
}

export interface CellRange {
  start: CellRef;
  end: CellRef;
}

// Convert column letter(s) to index (A=0, B=1, ... Z=25, AA=26, etc.)
export function columnToIndex(col: string): number {
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 64);
  }
  return index - 1;
}

// Convert column index to letter(s)
export function indexToColumn(index: number): string {
  let label = '';
  let n = index;
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

// Parse a cell reference like "A1" or "AB123"
export function parseCellRef(ref: string): CellRef | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  return {
    col: columnToIndex(match[1].toUpperCase()),
    row: parseInt(match[2], 10) - 1,
  };
}

// Parse a range like "A1:B5"
export function parseRange(rangeStr: string): CellRange | null {
  const parts = rangeStr.split(':');
  if (parts.length !== 2) return null;
  
  const start = parseCellRef(parts[0]);
  const end = parseCellRef(parts[1]);
  
  if (!start || !end) return null;
  return { start, end };
}

// Get all cell values in a range
export function getCellsInRange(range: CellRange, data: any[][]): (number | string)[] {
  const values: (number | string)[] = [];
  const minRow = Math.min(range.start.row, range.end.row);
  const maxRow = Math.max(range.start.row, range.end.row);
  const minCol = Math.min(range.start.col, range.end.col);
  const maxCol = Math.max(range.start.col, range.end.col);
  
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const value = data[row]?.[col];
      if (value !== undefined && value !== '') {
        values.push(value);
      }
    }
  }
  return values;
}

// Convert values to numbers, filtering out non-numeric values
function toNumbers(values: (number | string)[]): number[] {
  return values
    .map(v => typeof v === 'number' ? v : parseFloat(String(v)))
    .filter(n => !isNaN(n));
}

// Built-in functions
const FUNCTIONS: Record<string, (args: (number | string)[], data: any[][]) => number | string> = {
  SUM: (args, data) => {
    const numbers = toNumbers(args);
    return numbers.reduce((sum, n) => sum + n, 0);
  },
  AVERAGE: (args, data) => {
    const numbers = toNumbers(args);
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  },
  AVG: (args, data) => FUNCTIONS.AVERAGE(args, data),
  COUNT: (args, data) => {
    return toNumbers(args).length;
  },
  COUNTA: (args, data) => {
    return args.filter(v => v !== '' && v !== null && v !== undefined).length;
  },
  MIN: (args, data) => {
    const numbers = toNumbers(args);
    if (numbers.length === 0) return 0;
    return Math.min(...numbers);
  },
  MAX: (args, data) => {
    const numbers = toNumbers(args);
    if (numbers.length === 0) return 0;
    return Math.max(...numbers);
  },
  ABS: (args, data) => {
    const num = toNumbers(args)[0];
    return isNaN(num) ? '#VALUE!' : Math.abs(num);
  },
  ROUND: (args, data) => {
    const numbers = toNumbers(args);
    const value = numbers[0] ?? 0;
    const decimals = numbers[1] ?? 0;
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },
  FLOOR: (args, data) => {
    const num = toNumbers(args)[0];
    return isNaN(num) ? '#VALUE!' : Math.floor(num);
  },
  CEIL: (args, data) => {
    const num = toNumbers(args)[0];
    return isNaN(num) ? '#VALUE!' : Math.ceil(num);
  },
  CEILING: (args, data) => FUNCTIONS.CEIL(args, data),
  SQRT: (args, data) => {
    const num = toNumbers(args)[0];
    return isNaN(num) || num < 0 ? '#VALUE!' : Math.sqrt(num);
  },
  POWER: (args, data) => {
    const numbers = toNumbers(args);
    return Math.pow(numbers[0] ?? 0, numbers[1] ?? 1);
  },
  POW: (args, data) => FUNCTIONS.POWER(args, data),
  IF: (args, data) => {
    const condition = args[0];
    const trueValue = args[1] ?? '';
    const falseValue = args[2] ?? '';
    
    // Evaluate condition
    let isTrue = false;
    if (typeof condition === 'number') {
      isTrue = condition !== 0;
    } else if (typeof condition === 'string') {
      isTrue = condition.toLowerCase() === 'true' || condition === '1';
    } else {
      isTrue = Boolean(condition);
    }
    
    return isTrue ? trueValue : falseValue;
  },
  CONCAT: (args, data) => {
    return args.join('');
  },
  CONCATENATE: (args, data) => FUNCTIONS.CONCAT(args, data),
  LEN: (args, data) => {
    return String(args[0] ?? '').length;
  },
  UPPER: (args, data) => {
    return String(args[0] ?? '').toUpperCase();
  },
  LOWER: (args, data) => {
    return String(args[0] ?? '').toLowerCase();
  },
  TRIM: (args, data) => {
    return String(args[0] ?? '').trim();
  },
  LEFT: (args, data) => {
    const str = String(args[0] ?? '');
    const num = toNumbers([args[1] ?? 1])[0] ?? 1;
    return str.substring(0, num);
  },
  RIGHT: (args, data) => {
    const str = String(args[0] ?? '');
    const num = toNumbers([args[1] ?? 1])[0] ?? 1;
    return str.substring(str.length - num);
  },
  NOW: (args, data) => {
    return new Date().toLocaleString();
  },
  TODAY: (args, data) => {
    return new Date().toLocaleDateString();
  },
};

// Tokenize and evaluate a formula argument (could be a number, cell ref, range, or nested function)
function evaluateArgument(arg: string, data: any[][]): (number | string)[] {
  arg = arg.trim();
  
  // Check if it's a range (e.g., A1:B5)
  if (arg.includes(':')) {
    const range = parseRange(arg);
    if (range) {
      return getCellsInRange(range, data);
    }
  }
  
  // Check if it's a cell reference (e.g., A1)
  const cellRef = parseCellRef(arg);
  if (cellRef) {
    const value = data[cellRef.row]?.[cellRef.col] ?? '';
    // Recursively evaluate if the referenced cell contains a formula
    if (typeof value === 'string' && value.startsWith('=')) {
      const result = evaluateFormula(value, data);
      return [result];
    }
    return [value];
  }
  
  // Check if it's a nested function
  const funcMatch = arg.match(/^([A-Z]+)\((.*)\)$/i);
  if (funcMatch) {
    const result = evaluateFunctionCall(funcMatch[1], funcMatch[2], data);
    return [result];
  }
  
  // Check if it's a number
  const num = parseFloat(arg);
  if (!isNaN(num)) {
    return [num];
  }
  
  // Check if it's a quoted string
  if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
    return [arg.slice(1, -1)];
  }
  
  // Return as-is
  return [arg];
}

// Split function arguments, respecting nested parentheses
function splitArguments(argsStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];
    
    if ((char === '"' || char === "'") && !inString) {
      inString = true;
      stringChar = char;
      current += char;
    } else if (char === stringChar && inString) {
      inString = false;
      current += char;
    } else if (char === '(' && !inString) {
      depth++;
      current += char;
    } else if (char === ')' && !inString) {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0 && !inString) {
      args.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    args.push(current.trim());
  }
  
  return args;
}

// Evaluate a function call
function evaluateFunctionCall(funcName: string, argsStr: string, data: any[][]): number | string {
  const func = FUNCTIONS[funcName.toUpperCase()];
  if (!func) {
    return `#NAME?`; // Unknown function
  }
  
  const argStrings = splitArguments(argsStr);
  const allValues: (number | string)[] = [];
  
  for (const argStr of argStrings) {
    const values = evaluateArgument(argStr, data);
    allValues.push(...values);
  }
  
  try {
    return func(allValues, data);
  } catch (error) {
    return '#ERROR!';
  }
}

// Evaluate basic arithmetic expression (simple cases)
function evaluateArithmetic(expr: string, data: any[][]): number | string {
  // Replace cell references with their values
  let replaced = expr.replace(/([A-Z]+\d+)/gi, (match) => {
    const ref = parseCellRef(match);
    if (ref) {
      const value = data[ref.row]?.[ref.col];
      if (typeof value === 'string' && value.startsWith('=')) {
        const result = evaluateFormula(value, data);
        return typeof result === 'number' ? String(result) : `(${result})`;
      }
      const num = parseFloat(String(value));
      return isNaN(num) ? '0' : String(num);
    }
    return '0';
  });
  
  // Safely evaluate arithmetic
  try {
    // Only allow numbers, operators, parentheses, and whitespace
    if (!/^[\d\s+\-*/().]+$/.test(replaced)) {
      return '#VALUE!';
    }
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${replaced}`)();
    return typeof result === 'number' && isFinite(result) ? result : '#VALUE!';
  } catch {
    return '#ERROR!';
  }
}

// Main formula evaluation function
export function evaluateFormula(formula: string, data: any[][]): number | string {
  if (!formula.startsWith('=')) {
    return formula;
  }
  
  const expr = formula.substring(1).trim();
  
  // Check if it's a function call
  const funcMatch = expr.match(/^([A-Z]+)\((.*)\)$/i);
  if (funcMatch) {
    return evaluateFunctionCall(funcMatch[1], funcMatch[2], data);
  }
  
  // Check if it's a simple cell reference
  const cellRef = parseCellRef(expr);
  if (cellRef) {
    const value = data[cellRef.row]?.[cellRef.col];
    if (typeof value === 'string' && value.startsWith('=')) {
      return evaluateFormula(value, data);
    }
    return value ?? '';
  }
  
  // Try to evaluate as arithmetic expression
  return evaluateArithmetic(expr, data);
}

// Get the display value for a cell
export function getCellDisplayValue(value: any, data: any[][]): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  
  if (typeof value === 'string' && value.startsWith('=')) {
    const result = evaluateFormula(value, data);
    if (typeof result === 'number') {
      // Format numbers nicely
      return Number.isInteger(result) ? String(result) : result.toFixed(2);
    }
    return String(result);
  }
  
  return String(value);
}
