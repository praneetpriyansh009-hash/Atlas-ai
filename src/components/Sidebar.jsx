import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Bot, FileText, LogOut, Moon, Sun, ChevronRight, ChevronLeft, GraduationCap, FilePlus, ClipboardList, Mic, Sparkles, Crown } from './Icons';

const Sidebar = ({ currentView, setCurrentView, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed, user, onLogin, onLogout }) => {
    const { isDark, toggleTheme } = useTheme();
    const { tier, isPro, isDevMode, triggerUpgradeModal } = useSubscription();

    const navItems = [
        { id: 'doubt-solver', label: 'Doubt Solver', icon: Bot, section: 'section-doubt' },
        { id: 'document-study', label: 'Document Study', icon: FilePlus, section: 'section-document' },
        { id: 'podcast-generator', label: 'Podcast Studio', icon: Mic, section: 'section-podcast' },
        { id: 'college-compass', label: 'College Compass', icon: GraduationCap, section: 'section-compass' },
        { id: 'quiz-assessment', label: 'Quiz & Assessment', icon: ClipboardList, section: 'section-quiz' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed md:relative z-50 h-[96vh] my-[2vh] ml-[2vh]
                transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                ${isCollapsed ? 'w-20' : 'w-72'}
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[120%] md:translate-x-0'}
            `}>
                <div className={`
                    h-full flex flex-col rounded-3xl border border-white/10 shadow-2xl overflow-hidden
                    ${isDark ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-xl
                    transition-colors duration-300
                `}>

                    {/* Header */}
                    <div className="p-6 flex items-center justify-between">
                        {!isCollapsed && (
                            <div className="flex items-center gap-3 animate-slide-in-right">
                                <div className="p-2 bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 rounded-xl shadow-lg shadow-orange-500/20">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-display font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600">
                                    Aurem
                                </span>
                            </div>
                        )}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'} ${isCollapsed ? 'mx-auto' : ''}`}
                        >
                            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentView === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setCurrentView(item.id);
                                        if (window.innerWidth < 768) setIsSidebarOpen(false);
                                    }}
                                    className={`
                                        w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300 group
                                        relative overflow-hidden
                                        ${isActive
                                            ? `bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 translate-x-1`
                                            : 'text-theme-muted hover:bg-white/5 hover:text-theme-primary'
                                        }
                                        ${isCollapsed ? 'justify-center' : ''}
                                    `}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-white/10 animate-pulse-soft"></div>
                                    )}
                                    <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />

                                    {!isCollapsed && (
                                        <span className="font-medium truncate">{item.label}</span>
                                    )}

                                    {/* Hover 3D effect hint */}
                                    {!isActive && !isCollapsed && (
                                        <ChevronRight className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* User Profile & Footer */}
                    <div className="p-4 border-t border-white/5 space-y-4">
                        <button
                            onClick={toggleTheme}
                            className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'} ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
                            {!isCollapsed && <span className="text-sm font-medium text-theme-muted">Theme</span>}
                        </button>

                        {/* Subscription Status / Upgrade Button */}
                        {!isPro && !isDevMode ? (
                            <button
                                onClick={() => triggerUpgradeModal('upgrade')}
                                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 ${isCollapsed ? 'justify-center' : ''}`}
                            >
                                <Crown className="w-5 h-5" />
                                {!isCollapsed && (
                                    <div className="flex-1 text-left">
                                        <span className="text-sm font-bold">Upgrade to Pro</span>
                                        <p className="text-[10px] opacity-80">Unlimited access</p>
                                    </div>
                                )}
                            </button>
                        ) : (
                            <div className={`w-full p-3 rounded-xl flex items-center gap-3 ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'} border border-amber-500/20 ${isCollapsed ? 'justify-center' : ''}`}>
                                <Crown className="w-5 h-5 text-amber-500" />
                                {!isCollapsed && (
                                    <div className="flex-1">
                                        <span className="text-sm font-bold text-amber-500">{isDevMode ? 'Dev Mode' : 'Pro Active'}</span>
                                        <p className="text-[10px] text-theme-muted">All features unlocked</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? 'bg-black/20' : 'bg-white/40'} ${isCollapsed ? 'justify-center' : ''}`}>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-md">
                                {user?.displayName ? user.displayName[0].toUpperCase() : <span className="animate-pulse">?</span>}
                            </div>

                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-theme-primary truncate">
                                        {user?.displayName || 'User'}
                                    </p>
                                    <p className="text-xs text-theme-muted truncate">
                                        {user?.email || 'Guest'}
                                    </p>
                                </div>
                            )}

                            {!isCollapsed && (
                                <button
                                    onClick={onLogout}
                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-theme-muted hover:text-red-500 transition-colors"
                                >
                                    <LogOut size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
