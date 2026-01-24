import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';
import { AlertCircle, Bot, Sparkles } from './Icons';

const Login = ({ onSwitchToSignup }) => {
    const [error, setError] = useState('');
    const { loginWithGoogle } = useAuth();
    const [loading, setLoading] = useState(false);
    const cardRef = useRef(null);

    // 3D Tilt Logic
    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg rotation
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleMouseLeave = () => {
        if (cardRef.current) {
            cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            await loginWithGoogle();
        } catch (err) {
            console.error(err);
            // Enhanced Error Handling
            let msg = 'Failed to sign in.';
            if (err.code === 'auth/popup-closed-by-user') msg = 'Sign-in cancelled.';
            if (err.code === 'auth/network-request-failed') msg = 'Connection error. Check your internet.';
            if (err.code === 'auth/invalid-api-key') msg = 'System Error: Invalid API Key. Contact Support.';

            setError(msg + (err.message ? ` (${err.message})` : ''));
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-indigo-900 via-gray-900 to-black">
            {/* Animated 3D Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse-soft"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-float-delayed"></div>

                {/* Floating Orbs */}
                <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-full blur-xl opacity-60 animate-float"></div>
                <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-tr from-pink-500 to-rose-500 rounded-full blur-xl opacity-50 animate-float-delayed"></div>
            </div>

            {/* 3D Tilt Card */}
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="w-full max-w-sm relative group perspective-1000 transform-style-3d transition-transform duration-200 ease-out"
                style={{ transform: 'perspective(1000px)' }}
            >
                {/* Glow Effect behind card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>

                {/* Main Card Content */}
                <div className="relative p-8 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center text-center transform-style-3d">

                    {/* Floating Icon */}
                    <div className="mb-6 relative transform-style-3d tilt-content">
                        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"></div>
                        <div className="relative w-20 h-20 bg-gradient-to-tr from-gray-800 to-gray-900 rounded-2xl border border-white/10 flex items-center justify-center shadow-inner">
                            <Bot className="w-10 h-10 text-indigo-400" />
                        </div>
                        <div className="absolute -top-2 -right-2">
                            <Sparkles className="w-6 h-6 text-yellow-400 animate-spin-slow" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-display font-bold text-white mb-2 tilt-content tracking-tight">
                        Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Atlas</span>
                    </h2>

                    <p className="text-gray-400 text-sm mb-8 tilt-content leading-relaxed">
                        Your intelligent AI companion for <br /> academic excellence and discovery.
                    </p>

                    {error && (
                        <div className="mb-6 w-full p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs text-left animate-enter">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="w-full space-y-4 tilt-content">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="group relative w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white text-gray-900 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-70"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                            ) : (
                                <>
                                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                                    </svg>
                                    <span>Continue with Google</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 w-full flex justify-between items-center text-xs text-gray-500">
                        <span>v2.0 Premium</span>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <span>Systems Online</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
