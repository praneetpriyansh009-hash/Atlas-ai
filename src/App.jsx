import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SplashScreen from './components/SplashScreen';
import Sidebar from './components/Sidebar';
import DoubtSolver from './components/DoubtSolver';
import CollegeCompass from './components/CollegeCompass';
import QuizAssessment from './components/QuizAssessment';
import DocumentStudy from './components/DocumentStudy';
import PodcastGenerator from './components/PodcastGenerator';
import Login from './components/Login';
import Signup from './components/Signup';
import { Bot, GraduationCap, FileText, Menu, LogIn, FilePlus, Mic, Radio } from './components/Icons';
import { useRetryableFetch } from './utils/api';
import { getCurrentUser, logoutUser } from './utils/auth';

const AppContent = () => {
    const { isDark } = useTheme();
    const { currentUser, logout } = useAuth();
    const [currentView, setCurrentView] = useState('doubt-solver');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { retryableFetch } = useRetryableFetch();

    useEffect(() => {
        setTimeout(() => setIsLoading(false), 3000);
    }, []);

    useEffect(() => {
        if (currentUser) {
            setCurrentView('doubt-solver');
        } else {
            setCurrentView('login');
        }
    }, [currentUser]);

    const handleLogout = async () => {
        await logout();
        setCurrentView('login');
    };

    const renderContent = () => {
        switch (currentView) {
            case 'login':
                return <Login onSwitchToSignup={() => setCurrentView('signup')} />;
            case 'signup':
                return <Signup onSwitchToLogin={() => setCurrentView('login')} />;
            case 'doubt-solver':
                return <DoubtSolver retryableFetch={retryableFetch} />;
            case 'document-study':
                return <DocumentStudy retryableFetch={retryableFetch} />;
            case 'college-compass':
                return <CollegeCompass retryableFetch={retryableFetch} />;
            case 'quiz-assessment':
                return <QuizAssessment retryableFetch={retryableFetch} />;
            case 'podcast-generator':
                return <PodcastGenerator retryableFetch={retryableFetch} />;
            default:
                return <DoubtSolver retryableFetch={retryableFetch} />;
        }
    };

    const getHeaderTitle = () => {
        switch (currentView) {
            case 'login': return 'Sign In';
            case 'signup': return 'Create Account';
            case 'doubt-solver': return 'Doubt Solver';
            case 'document-study': return 'Document Study';
            case 'college-compass': return 'College Compass';
            case 'quiz-assessment': return 'Assessment';
            case 'podcast-generator': return 'Podcast Studio';
            default: return 'Atlas';
        }
    };

    const getHeaderIcon = () => {
        switch (currentView) {
            case 'login':
            case 'signup': return <LogIn className="w-5 h-5 mr-2 text-theme-primary" />;
            case 'doubt-solver': return <Bot className="w-5 h-5 mr-2 text-indigo-500" />;
            case 'document-study': return <FilePlus className="w-5 h-5 mr-2 text-emerald-500" />;
            case 'college-compass': return <GraduationCap className="w-5 h-5 mr-2 text-sky-500" />;
            case 'quiz-assessment': return <FileText className="w-5 h-5 mr-2 text-purple-500" />;
            case 'podcast-generator': return <Mic className="w-5 h-5 mr-2 text-rose-500" />;
            default: return <Bot className="w-5 h-5 mr-2 text-indigo-500" />;
        }
    };

    return (
        <div className={`flex h-screen bg-theme-primary font-sans overflow-hidden transition-colors duration-300 selection:bg-indigo-500/30`}>
            {/* Decorative blurs - theme aware */}
            <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
                <div className={`absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-[128px] -translate-x-1/3 -translate-y-1/3 ${isDark ? 'bg-indigo-600' : 'bg-cyan-300'}`}></div>
                <div className={`absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[128px] translate-x-1/3 translate-y-1/3 ${isDark ? 'bg-purple-600' : 'bg-rose-300'}`}></div>
            </div>

            {isLoading && <SplashScreen onComplete={() => setIsLoading(false)} />}

            {currentUser && (
                <Sidebar
                    currentView={currentView}
                    setCurrentView={setCurrentView}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                    user={currentUser}
                    onLogin={() => setCurrentView('login')}
                    onLogout={handleLogout}
                />
            )}

            <div className={`
                flex-1 flex flex-col h-full relative z-10 transition-all duration-300
                ${currentUser ? 'md:my-[2vh] md:mr-[2vh] md:rounded-3xl border border-white/10 shadow-2xl overflow-hidden glass-panel' : ''}
            `}>
                {currentUser && (
                    <header className="md:hidden glass-panel p-4 shadow-xl flex items-center z-30 sticky top-0 border-b border-white/5">
                        <button onClick={() => setIsSidebarOpen(true)} className="mr-3 text-theme-muted hover:text-theme-primary">
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="font-bold text-theme-primary flex items-center">
                            {getHeaderIcon()}
                            {getHeaderTitle()}
                        </h1>
                    </header>
                )}

                <main className="flex-1 overflow-hidden relative">
                    <div key={currentView} className="h-full animate-view-transition">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

const App = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
