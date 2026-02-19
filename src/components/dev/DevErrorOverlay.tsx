import React, { Component, ErrorInfo, ReactNode, useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronRight, Copy, Check, RefreshCw } from 'lucide-react';

// ── Error‑hint mapping ──────────────────────────────────────────────
interface Hint {
  pattern: RegExp;
  title: string;
  suggestion: string;
}

const ERROR_HINTS: Hint[] = [
  {
    pattern: /Cannot find name '(\w+)'/,
    title: 'Missing import or declaration',
    suggestion: 'Add the missing import at the top of the file, e.g.\nimport { $1 } from "…";',
  },
  {
    pattern: /Property '(\w+)' does not exist on type '(.+)'/,
    title: 'Unknown property on type',
    suggestion:
      'Either the property "$1" was removed/renamed, or the type "$2" needs to be extended.\nCheck the interface definition and update it.',
  },
  {
    pattern: /is not assignable to parameter of type '(.+)'/,
    title: 'Type mismatch',
    suggestion:
      'The value you are passing doesn\'t match the expected type "$1".\nVerify the source type has all required properties (look for missing fields like updated_at, id, etc.).',
  },
  {
    pattern: /used before its declaration/,
    title: 'Variable used before declaration',
    suggestion:
      'Move the variable declaration above the line where it is first used, or restructure the code so the reference comes after the declaration.',
  },
  {
    pattern: /Object literal may only specify known properties/,
    title: 'Extra / unknown property in object literal',
    suggestion:
      'The object has a key that isn\'t part of the expected type.\nCheck the Record/interface definition for allowed keys.',
  },
  {
    pattern: /This comparison appears to be unintentional/,
    title: 'Impossible comparison',
    suggestion:
      'TypeScript determined the two types can never overlap. Verify the union type includes the value you\'re comparing against.',
  },
  {
    pattern: /Module '"(.+)"' has no exported member '(\w+)'/,
    title: 'Missing export',
    suggestion: 'The module "$1" doesn\'t export "$2".\nCheck for typos or verify the export exists in the source file.',
  },
  {
    pattern: /Cannot find module '(.+)'/,
    title: 'Missing module',
    suggestion: 'Module "$1" is not installed or the path is wrong.\nRun: npm install $1\nOr check the import path.',
  },
  {
    pattern: /TS\d+/,
    title: 'TypeScript error',
    suggestion: 'Check the TypeScript documentation for this error code at:\nhttps://typescript.tv/errors/',
  },
];

function matchHint(message: string): Hint | null {
  for (const hint of ERROR_HINTS) {
    const match = message.match(hint.pattern);
    if (match) {
      return {
        ...hint,
        suggestion: hint.suggestion.replace(/\$(\d)/g, (_, i) => match[Number(i)] ?? ''),
      };
    }
  }
  return null;
}

// ── Parsed build‑error type ─────────────────────────────────────────
interface BuildError {
  file: string;
  line: number;
  col: number;
  code: string;
  message: string;
}

function parseBuildErrors(raw: string): BuildError[] {
  const regex = /([^\s(]+)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.+)/g;
  const errors: BuildError[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(raw)) !== null) {
    errors.push({ file: m[1], line: +m[2], col: +m[3], code: m[4], message: m[5] });
  }
  return errors;
}

// ── Collapsible error row ───────────────────────────────────────────
function ErrorRow({ error }: { error: BuildError }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const hint = matchHint(error.message);

  const copyLocation = () => {
    navigator.clipboard.writeText(`${error.file}:${error.line}:${error.col}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border border-red-800/40 rounded-lg bg-red-950/30 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-2 p-3 text-left hover:bg-red-900/20 transition-colors"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
        ) : (
          <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
        )}
        <div className="flex-1 min-w-0">
          <span className="font-mono text-xs text-red-300 break-all">{error.code}</span>
          <p className="text-sm text-red-100 mt-0.5 break-words">{error.message}</p>
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-red-800/30 pt-2">
          {/* Location */}
          <div className="flex items-center gap-2 text-xs text-red-300">
            <span className="font-mono truncate">
              {error.file}:{error.line}:{error.col}
            </span>
            <button
              onClick={copyLocation}
              className="shrink-0 p-1 rounded hover:bg-red-800/40 transition-colors"
              title="Copy file location"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* Actionable hint */}
          {hint && (
            <div className="rounded-md bg-amber-950/40 border border-amber-700/40 p-2.5">
              <p className="text-xs font-semibold text-amber-300 mb-1">💡 {hint.title}</p>
              <pre className="text-xs text-amber-200/80 whitespace-pre-wrap font-mono leading-relaxed">
                {hint.suggestion}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Overlay UI ──────────────────────────────────────────────────────
function OverlayContent({ errors, onDismiss }: { errors: BuildError[]; onDismiss: () => void }) {
  const grouped = errors.reduce<Record<string, BuildError[]>>((acc, e) => {
    (acc[e.file] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-auto p-4">
      <div className="w-full max-w-2xl my-8 rounded-xl bg-gray-950 border border-red-700/60 shadow-2xl shadow-red-900/30">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-red-800/40">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-bold text-red-100">
              Build Errors{' '}
              <span className="text-sm font-normal text-red-400">({errors.length})</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 rounded-md hover:bg-red-800/30 text-red-300 transition-colors"
              title="Reload page"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-md hover:bg-red-800/30 text-red-300 transition-colors"
              title="Dismiss overlay"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-auto">
          {Object.entries(grouped).map(([file, errs]) => (
            <div key={file}>
              <p className="text-xs font-mono text-gray-400 mb-2 truncate" title={file}>
                📄 {file}
              </p>
              <div className="space-y-2">
                {errs.map((e, i) => (
                  <ErrorRow key={`${e.code}-${e.line}-${i}`} error={e} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="px-5 py-3 border-t border-red-800/30 text-xs text-gray-500">
          Fix the errors above and save the file — the page will hot‑reload automatically.
        </div>
      </div>
    </div>
  );
}

// ── Error Boundary wrapper ──────────────────────────────────────────
interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
  dismissed: boolean;
}

export class DevErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, dismissed: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, dismissed: false };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[DevErrorBoundary]', error, info.componentStack);
  }

  handleDismiss = () => this.setState({ dismissed: true });

  render() {
    const { hasError, error, dismissed } = this.state;

    if (hasError && error && !dismissed) {
      const parsed = parseBuildErrors(error.message);
      if (parsed.length > 0) {
        return (
          <>
            {this.props.children}
            <OverlayContent errors={parsed} onDismiss={this.handleDismiss} />
          </>
        );
      }
      // Fallback for non‑build errors
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
          <div className="max-w-lg w-full bg-gray-950 border border-red-700/60 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-bold text-red-100">Runtime Error</h2>
            </div>
            <pre className="text-sm text-red-200 whitespace-pre-wrap font-mono bg-red-950/30 p-3 rounded-lg mb-4">
              {error.message}
            </pre>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm rounded-lg bg-red-800/40 text-red-200 hover:bg-red-800/60 transition-colors"
              >
                Reload
              </button>
              <button
                onClick={this.handleDismiss}
                className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── Standalone overlay for Vite HMR errors ──────────────────────────
export function DevBuildErrorOverlay() {
  const [errors, setErrors] = useState<BuildError[]>([]);
  const [dismissed, setDismissed] = useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleViteError = (event: CustomEvent) => {
      const msg = event.detail?.message || event.detail?.err?.message || '';
      const parsed = parseBuildErrors(msg);
      if (parsed.length) {
        setErrors(parsed);
        setDismissed(false);
      }
    };

    const handleUnhandled = (event: ErrorEvent) => {
      const parsed = parseBuildErrors(event.message);
      if (parsed.length) {
        setErrors(parsed);
        setDismissed(false);
      }
    };

    window.addEventListener('vite:error' as any, handleViteError);
    window.addEventListener('error', handleUnhandled);

    return () => {
      window.removeEventListener('vite:error' as any, handleViteError);
      window.removeEventListener('error', handleUnhandled);
    };
  }, []);

  if (!errors.length || dismissed) return null;

  return <OverlayContent errors={errors} onDismiss={() => setDismissed(true)} />;
}
