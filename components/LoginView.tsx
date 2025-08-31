
import React from 'react';
import { SeymourIcon, GoogleIcon } from './icons';

interface LoginViewProps {
    onLogin: () => void;
    onGuestLogin: () => void;
    isApiReady: boolean;
    isApiKeyMissing: boolean;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onGuestLogin, isApiReady, isApiKeyMissing }) => {
    return (
        <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-900">
             {isApiKeyMissing && (
                <div className="absolute top-0 left-0 right-0 p-4 bg-red-100 dark:bg-red-900/30 border-b border-red-300 dark:border-red-500/30 text-center">
                    <p className="text-sm text-red-800 dark:text-red-200">
                        <strong>Configuration needed:</strong> Your Gemini API key is missing. AI features will not work.
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Please create a <code>.env</code> file in the project's root directory and add your key: <code>API_KEY=YOUR_KEY_HERE</code>
                    </p>
                </div>
            )}
            <div className="w-full max-w-sm mx-auto text-center">
                <SeymourIcon className="w-24 h-24 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">See-More, Feed Me!</h1>
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
            </div>
        </div>
    );
};

export default LoginView;
