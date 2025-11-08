import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    copied: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            copied: false,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            errorInfo: null,
            copied: false,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to monitoring service
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        this.setState({
            error,
            errorInfo,
        });

        // Send error to monitoring service (e.g., Sentry)
        if (typeof window !== 'undefined' && (window as any).Sentry) {
            (window as any).Sentry.captureException(error, {
                contexts: {
                    react: {
                        componentStack: errorInfo.componentStack,
                    },
                },
            });
        }

        // Log to backend
        this.logErrorToBackend(error, errorInfo);
    }

    logErrorToBackend = async (error: Error, errorInfo: ErrorInfo) => {
        try {
            await fetch('/api/log-error', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    message: error.message,
                    stack: error.stack,
                    componentStack: errorInfo.componentStack,
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                }),
            });
        } catch (e) {
            console.error('Failed to log error to backend:', e);
        }
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    handleCopyError = async () => {
        const errorText = this.getErrorText();
        
        try {
            await navigator.clipboard.writeText(errorText);
            this.setState({ copied: true });
            
            // Reset copied state after 2 seconds
            setTimeout(() => {
                this.setState({ copied: false });
            }, 2000);
        } catch (err) {
            console.error('Failed to copy error:', err);
        }
    };

    getErrorText = (): string => {
        const { error, errorInfo } = this.state;
        
        const parts = [
            '=== Error Details ===',
            '',
            `Error: ${error?.toString() || 'Unknown error'}`,
            '',
            `URL: ${window.location.href}`,
            `User Agent: ${navigator.userAgent}`,
            `Timestamp: ${new Date().toISOString()}`,
            '',
        ];

        if (error?.stack) {
            parts.push('=== Stack Trace ===');
            parts.push(error.stack);
            parts.push('');
        }

        if (errorInfo?.componentStack) {
            parts.push('=== Component Stack ===');
            parts.push(errorInfo.componentStack);
        }

        return parts.join('\n');
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                    <Card className="max-w-2xl w-full">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">Something went wrong</CardTitle>
                                    <CardDescription>
                                        We're sorry, but something unexpected happened
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                            Error Details
                                        </h3>
                                        <Button
                                            onClick={this.handleCopyError}
                                            size="sm"
                                            variant="outline"
                                            className="h-8"
                                        >
                                            {this.state.copied ? (
                                                <>
                                                    <Check className="mr-2 h-3 w-3" />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="mr-2 h-3 w-3" />
                                                    Copy Error
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto">
                                        <p className="text-sm font-mono text-red-600 dark:text-red-400 mb-2">
                                            {this.state.error.toString()}
                                        </p>
                                        {this.state.errorInfo && (
                                            <details className="mt-2">
                                                <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                                                    Component Stack
                                                </summary>
                                                <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                                    {this.state.errorInfo.componentStack}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={this.handleReload}
                                    className="flex-1"
                                    variant="default"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Reload Page
                                </Button>
                                <Button
                                    onClick={this.handleGoHome}
                                    className="flex-1"
                                    variant="outline"
                                >
                                    <Home className="mr-2 h-4 w-4" />
                                    Go to Home
                                </Button>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                If this problem persists, please contact support
                            </p>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
