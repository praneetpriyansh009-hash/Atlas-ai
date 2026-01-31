import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sparkles } from './Icons';

const SplashScreen = ({ onComplete }) => {
    const { isDark } = useTheme();
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Splash screen timing: Logo at 500ms, Text at 1500ms, Secondary text at 3000ms, Complete at 5000ms
        const t = [
            setTimeout(() => setStep(1), 500),    // Logo appears
            setTimeout(() => setStep(2), 1500),   // "AUREM" text appears
            setTimeout(() => setStep(3), 4500),   // Start fade out
            setTimeout(onComplete, 5000)          // Complete (5 seconds total)
        ];
        return () => t.forEach(clearTimeout);
    }, [onComplete]);

    if (step === 3) return null;

    return (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-warm-100'} transition-opacity duration-700 ${step === 3 ? 'opacity-0' : 'opacity-100'}`}>
            {/* Ambient glow effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-[100px] animate-pulse delay-500"></div>
            </div>

            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <div className={`transition-all duration-1000 transform ${step >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/30 animate-float">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                </div>
            </div>
            <h1 className={`mt-10 text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 tracking-tight transition-all duration-1000 transform ${step >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                AUREM
            </h1>
            <p className={`mt-4 text-theme-muted text-sm tracking-[0.3em] uppercase font-medium transition-all duration-1000 delay-300 transform ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                Where Curiosity Becomes Clarity
            </p>
            <p className={`mt-2 text-theme-muted/60 text-xs tracking-wider transition-all duration-1000 delay-500 transform ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                Your AI-Powered Learning Companion
            </p>
        </div>
    );
};

export default SplashScreen;

