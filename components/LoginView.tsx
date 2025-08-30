import React from 'react';
import { SeymourIcon, GoogleIcon } from './icons';

interface LoginViewProps {
    onLogin: () => void;
    onGuestLogin: () => void;
    isApiReady: boolean;
    isAiDisabled: boolean;
    onResetAiCooldown: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onGuestLogin, isApiReady, isAiDisabled, onResetAiCooldown }) => {
    return (
        <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-900">
            <div className="w-full max-w-sm mx-auto text-center">
                <SeymourIcon className="w-24 h-24 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Welcome to See More</h1>
                <p className="text-gray-500 dark:text-zinc-400 mb-8">Sign in with Google to sync feeds or continue as a guest.</p>
                <div className="px-4">
                    <button
                        type="button"
                        onClick={onLogin}
                        disabled={!isApiReady}
                        className="w-full bg-white text-zinc-700 font-medium py-2.5 px-4 rounded-md border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900 focus:ring-lime-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
                    >
                        <GoogleIcon className="w-5 h-5" />
                        <span>Sign in with Google</span>
                    </button>
                    <button
                        type="button"
                        onClick={onGuestLogin}
                        className="mt-4 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-lime-500 dark:hover:text-lime-400"
                    >
                        Continue as Guest
                    </button>
                    {!isApiReady && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-4">Initializing...</p>}
                </div>
                {isAiDisabled && (
                    <div className="mt-8 text-center">
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">AI features are temporarily disabled.</p>
                        <button 
                            onClick={onResetAiCooldown}
                            className="mt-2 text-xs font-medium text-gray-500 dark:text-zinc-400 underline hover:text-lime-500"
                        >
                            Reset Cooldown
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginView;