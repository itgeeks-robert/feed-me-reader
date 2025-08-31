import React from 'react';
import { SeymourIcon, GoogleIcon } from './icons';

interface LoginViewProps {
    onLogin: () => void;
    onGuestLogin: () => void;
    isApiReady: boolean;
    isApiKeyMissing: boolean;
    isGoogleClientIdMissing: boolean;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onGuestLogin, isApiReady, isApiKeyMissing, isGoogleClientIdMissing }) => {
    const isConfigMissing = isApiKeyMissing || isGoogleClientIdMissing;

    return (
        <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-900">
             {isConfigMissing && (
                <div className="absolute top-0 left-0 right-0 p-4 bg-yellow-100 dark:bg-yellow-900/30 border-b border-yellow-300 dark:border-yellow-500/30 text-center">
                    <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                        Action Required: Configuration Missing
                    </p>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                        {isApiKeyMissing && (
                            <p>Your <strong>Gemini API Key</strong> is not set. AI features like sports scores will be disabled.</p>
                        )}
                        {isGoogleClientIdMissing && (
                             <p>Your <strong>Google Client ID</strong> is not set. Google Sign-In and cloud sync will be disabled.</p>
                        )}
                        <p className="mt-2 pt-1 border-t border-yellow-600/20">Please create a <code>.env</code> file in the project's root and add your keys (e.g., <code>API_KEY=...</code>).</p>
                    </div>
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
                        disabled={!isApiReady || isGoogleClientIdMissing}
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
