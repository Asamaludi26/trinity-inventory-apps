import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
          <AlertTriangle className="h-20 w-20 text-destructive" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Terjadi Kesalahan</h1>
            <p className="text-muted-foreground text-lg">
              Aplikasi mengalami error yang tidak terduga.
            </p>
            {this.state.error && (
              <p className="text-muted-foreground font-mono text-sm">{this.state.error.message}</p>
            )}
          </div>
          <Button onClick={this.handleReset}>Kembali ke Dashboard</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
