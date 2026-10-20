"use client";

import React from "react";
import { AlertTriangle, RotateCcw, RefreshCw } from "lucide-react";

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || "Unexpected runtime exception occurred.",
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[KeyCaster ErrorBoundary]:", error, errorInfo);
  }

  handleRecover = (): void => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  handleHardReset = (): void => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("keycaster_settings_v4");
        window.location.reload();
      }
    } catch {
      this.setState({ hasError: false, errorMessage: "" });
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-lg mx-auto my-12 p-6 rounded-2xl border border-error/40 bg-bg/95 backdrop-blur-md text-text font-mono shadow-2xl flex flex-col items-center text-center space-y-4 animate-fadeIn">
          <div className="w-12 h-12 rounded-xl bg-error/15 text-error flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-text">Stage Runtime Recovery</h2>
            <p className="text-xs text-sub">
              KeyCaster intercepted a client render issue and protected your local IndexedDB progress.
            </p>
          </div>

          {this.state.errorMessage && (
            <div className="w-full p-2.5 rounded-lg bg-sub/10 border border-sub/20 text-[11px] text-error/90 truncate">
              {this.state.errorMessage}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-2">
            <button
              type="button"
              onClick={this.handleRecover}
              className="flex-1 w-full py-2.5 px-4 rounded-xl bg-main text-bg text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload Stage</span>
            </button>

            <button
              type="button"
              onClick={this.handleHardReset}
              className="flex-1 w-full py-2.5 px-4 rounded-xl border border-sub/30 text-sub hover:text-text text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Preferences</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
