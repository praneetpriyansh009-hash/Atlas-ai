import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Cpu } from './Icons';

const SplashScreen = ({ onComplete }) => {
    const { isDark } = useTheme();
    const [step, setStep] = useState(0);

    useEffect(() => {
        const t = [setTimeout(() => setStep(1), 500), setTimeout(() => setStep(2), 1500), setTimeout(() => setStep(3), 2500), setTimeout(onComplete, 3000)];
        return () => t.forEach(clearTimeout);
    }, [onComplete]);

    if (step === 3) return null;

    return (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-warm-100'} transition-opacity duration-700 ${step === 3 ? 'opacity-0' : 'opacity-100'}`}>
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className={`transition-all duration-1000 transform ${step >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl animate-float">
                        <Cpu className="w-8 h-8 text-white" />
                    </div>
                </div>
            </div>
            <h1 className={`mt-8 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 tracking-wider transition-all duration-1000 transform ${step >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                ATLAS PREMIUM PLATFORM
            </h1>
            <p className={`mt-2 text-theme-muted text-sm tracking-widest uppercase transition-all duration-1000 delay-300 transform ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                Adaptive Learning Intelligence
            </p>
        </div>
    );
};

export default SplashScreen;
