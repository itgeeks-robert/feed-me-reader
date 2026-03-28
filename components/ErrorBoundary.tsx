import { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from './icons';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[999] bg-black flex items-center justify-center p-6 font-mono">
          <div className="void-card w-full max-w-md border-2 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.3)] overflow-hidden">
            <header className="h-10 bg-red-600 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-white" />
                <h2 className="text-white text-[9px] font-black uppercase tracking-[0.2em] italic">KERNEL_PANIC.EXE</h2>
              </div>
            </header>
            
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mx-auto border border-red-600/20">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-white font-black uppercase italic tracking-tighter text-xl">SYSTEM_CRITICAL_FAILURE</h3>
                <p className="text-[10px] text-zinc-500 leading-relaxed uppercase font-bold tracking-tight px-4 italic">
                  An unrecoverable error has occurred in the synaptic uplink.
                </p>
              </div>

              <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-lg text-left overflow-hidden">
                <p className="text-[8px] text-red-500 font-bold uppercase mb-1">Error Trace:</p>
                <p className="text-[9px] text-zinc-400 font-mono break-all line-clamp-3">
                  {this.state.error?.message || 'Unknown kernel exception'}
                </p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-4 bg-white text-black rounded-xl text-[10px] font-black uppercase italic shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Attempt_Reboot</span>
                </button>
                
                <button 
                  onClick={this.handleReset}
                  className="w-full py-3 bg-red-600/10 border border-red-600/30 text-red-600 rounded-xl text-[9px] font-black uppercase italic hover:bg-red-600 hover:text-white transition-all"
                >
                  Hard_System_Reset (Clears Cache)
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
