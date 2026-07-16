import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          padding: 'var(--space-6)',
        }}>
          <div className="card animate-in" style={{
            maxWidth: 500,
            width: '100%',
            textAlign: 'center',
            padding: 'var(--space-8)',
            border: '1px solid var(--accent)',
            boxShadow: '0 8px 32px rgba(214, 40, 40, 0.15)',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(214, 40, 40, 0.1)',
              color: 'var(--accent)',
              marginBottom: 'var(--space-4)',
            }}>
              <AlertOctagon size={28} />
            </div>
            <h2 style={{ marginBottom: 'var(--space-2)' }}>Interface Exception Detected</h2>
            <p style={{
              color: 'var(--ink-secondary)',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-6)',
              lineHeight: 1.5
            }}>
              An unexpected runtime error occurred while processing the telemetry feed. Sentinel Nexus has isolated the component to prevent wider system instability.
            </p>
            {this.state.error && (
              <pre style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--line)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)',
                fontFamily: 'monospace',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: 'var(--space-6)',
                color: 'var(--accent)',
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <button
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{ margin: '0 auto' }}
            >
              <RotateCcw size={14} style={{ marginRight: 6 }} /> Reload Interface
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
