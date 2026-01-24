import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Bot, BookOpen, Search, RotateCw, Send, Menu, X,
    GraduationCap, Code, Server, AlertTriangle, Loader2,
    ClipboardList, MessageSquare, Lightbulb, MapPin, Trophy,
    Link as LinkIcon, Globe, Sparkles, ChevronRight, ChevronLeft, LayoutDashboard,
    User, Cpu, FileText, CheckCircle, ArrowLeft, Brain, UserCheck
} from 'lucide-react';

// --- Global Constants ---

// LLM API Settings
const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
// NOTE: API Key is provided by the environment
// NOTE: API Key is provided by the environment
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Mock Syllabus Data for RAG (Doubt Solver)
const MOCK_SYLLABUS = `
  --- Class 10 History: Rise of Nationalism ---
  The rise of nationalism in Europe was primarily driven by the **French Revolution** (1789), which introduced the ideas of 'liberty, equality, fraternity' and the concept of the **nation-state** based on shared identity, not just a ruling monarch. 
  Key figures include Giuseppe Garibaldi, who unified southern Italy, and Otto von Bismarck, whose 'Blood and Iron' policy led to German unification. The syllabus emphasizes the shift from absolute monarchies to sovereign nation-states.

  --- Physics: Newton's Laws ---
  Newton's Second Law of Motion is defined by the equation **F=ma**, where acceleration (a) is directly proportional to the net force (F) and inversely proportional to the mass (m). The syllabus application focuses on solving problems involving constant mass and variable forces, specifically motion on inclined planes and systems with pulleys.
`;

// --- Custom CSS for Animations and Glassmorphism ---
const styles = `
  @keyframes gradient-x {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }

  @keyframes slide-up {
    0% { opacity: 0; transform: translateY(40px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes message-pop {
    0% { opacity: 0; transform: scale(0.95) translateY(10px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }

  @keyframes view-transition { 
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  .animate-slide-up {
    animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .animate-slide-up-delay-1 {
    animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
    opacity: 0;
  }
  .animate-message {
    animation: message-pop 0.3s ease-out;
  }
  .animate-view-transition { 
    animation: view-transition 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; 
  }

  .glass-panel {
    background: var(--glass-bg, rgba(17, 24, 39, 0.7));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  }

  .glass-panel-lighter {
    background: var(--glass-bg-light, rgba(31, 41, 55, 0.7));
    backdrop-filter: blur(12px);
    border: 1px solid var(--glass-border-light, rgba(255, 255, 255, 0.15));
  }

  /* Scrollbar Styling for dark mode */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.05);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.2);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.3);
  }
`;

/**
 * Custom hook for exponential backoff retry logic.
 */
const useRetryableFetch = () => {
    const maxRetries = 3;

    const retryableFetch = useCallback(async (url, options) => {
        let lastError = null;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                const response = await fetch(url, options);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                lastError = error;
            }
        }
        throw new Error(`Failed after ${maxRetries} attempts. Last error: ${lastError ? lastError.message : 'Unknown error'}`);
    }, [maxRetries]);

    return retryableFetch;
};

// --- SPLASH SCREEN COMPONENT (Unchanged) ---
const SplashScreen = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setStep(1), 500),
            setTimeout(() => setStep(2), 1500),
            setTimeout(() => setStep(3), 2500),
            setTimeout(onComplete, 3000)
        ];
        return () => timers.forEach(clearTimeout);
    }, [onComplete]);

    if (step === 3) return null;

    return (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 transition-opacity duration-700 ${step === 3 ? 'opacity-0' : 'opacity-100'}`}>
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className={`relative transition-all duration-1000 transform ${step >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl animate-float">
                        <Cpu className="w-12 h-12 text-white" />
                    </div>
                </div>
            </div>
            <h1 className={`mt-8 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 tracking-wider transition-all duration-1000 transform ${step >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                ATLAS PREMIUM PLATFORM
            </h1>
            <p className={`mt-2 text-gray-400 text-sm tracking-widest uppercase transition-all duration-1000 delay-300 transform ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                Adaptive Learning Intelligence
            </p>
        </div>
    );
};

// --- COMPONENT 1: DOUBT SOLVER (Unchanged Functionality) ---

const DoubtSolver = ({ retryableFetch }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isRagMode, setIsRagMode] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // Initial Message (FIXED: Mode-agnostic welcome)
    useEffect(() => {
        setMessages([{
            role: 'model',
            text: "Hello! I am ATLAS. I'm ready to help with your studies. Use the toggle above to switch between Syllabus RAG and General AI modes.",
            grounded: false
        }]);
    }, []);

    // Mode Switch Notification 
    useEffect(() => {
        if (messages.length > 1 || (messages.length === 1 && messages[0].role !== 'model')) {
            setMessages(prev => [...prev, {
                role: 'system',
                text: `Active Mode: ${isRagMode ? 'Syllabus RAG (Strict)' : 'General Knowledge (Open)'}`,
                grounded: isRagMode
            }]);
        }
    }, [isRagMode]);

    // Handle Send Message (Logic Unchanged)
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setError(null);

        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        let systemPrompt = '';

        if (isRagMode) {
            // RAG Logic
            systemPrompt = `You are ATLAS, an elite educational assistant. 
          CRITICAL INSTRUCTION: You MUST only use the following 'CURRICULUM CONTEXT' to formulate your answer.
          Do not use any external knowledge. If the question cannot be answered using the provided context, politely 
          state that the information is not available in the syllabus.
          
          CURRICULUM CONTEXT:
          ---
          ${MOCK_SYLLABUS}
          ---
          Student Query: "${userMessage}"`;
        } else {
            // General Logic
            systemPrompt = `You are a helpful and knowledgeable AI assistant. Answer the user's question accurately using your vast general knowledge.`;
        }

        try {
            const payload = {
                contents: [{ parts: [{ text: userMessage }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };
            const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
            const result = await retryableFetch(API_URL + `?key=${API_KEY}`, options);
            const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, I could not generate a response.";

            setMessages(prev => [...prev, { role: 'model', text: generatedText, grounded: isRagMode }]);
        } catch (err) {
            setError("An error occurred. Please try again.");
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // DARK THEME BASE
        <div className="flex flex-col h-full bg-gray-900 text-white relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-indigo-900/10 to-transparent -z-10 pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl -z-10 pointer-events-none" />

            {/* Doubt Solver Header (Glass Panel) */}
            <div className="px-8 py-5 glass-panel sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl border-b border-indigo-500/10">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center tracking-tight">
                        <Sparkles className="w-6 h-6 mr-2 text-indigo-400 fill-indigo-800" />
                        ATLAS Doubt Solver
                    </h2>
                    <p className="text-sm text-slate-400 font-medium">Adaptive Learning Intelligence</p>
                </div>

                {/* Premium Toggle Switch (Styled for Dark) */}
                <div className='flex glass-panel-lighter p-1.5 rounded-full border border-white/20 shadow-inner'>
                    <button
                        onClick={() => setIsRagMode(true)}
                        className={`flex items-center px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${isRagMode
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transform scale-105'
                            : 'text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        <BookOpen className="w-3.5 h-3.5 mr-2" /> Syllabus RAG
                    </button>
                    <button
                        onClick={() => setIsRagMode(false)}
                        className={`flex items-center px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${!isRagMode
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transform scale-105'
                            : 'text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        <Globe className="w-3.5 h-3.5 mr-2" /> General AI
                    </button>
                </div>
            </div>

            {/* RAG Context Viewer (Collapsible) */}
            {isRagMode && (
                <div className="px-8 py-2 bg-indigo-900/50 border-b border-indigo-700/50 backdrop-blur-sm animate-slide-up">
                    <details className="group">
                        <summary className="cursor-pointer text-xs font-bold text-indigo-400 hover:text-white flex items-center transition-colors">
                            <div className='w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse'></div>
                            Active Context Source: Class 10 History & Physics
                            <ChevronRight className="w-3 h-3 ml-1 group-open:rotate-90 transition-transform" />
                        </summary>
                        <div className="mt-3 p-4 glass-panel-lighter rounded-xl border border-white/10 text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar shadow-lg">
                            {MOCK_SYLLABUS}
                        </div>
                    </details>
                </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scroll-smooth custom-scrollbar">
                {messages.map((msg, index) => {
                    if (msg.role === 'system') {
                        return (
                            <div key={index} className="flex justify-center my-4 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
                                <span className="text-[10px] font-bold text-slate-400 glass-panel-lighter px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/10 shadow-lg">{msg.text}</span>
                            </div>
                        );
                    }
                    return (
                        <div key={index} className={`flex w-full group animate-message ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] sm:max-w-[70%] p-5 rounded-2xl shadow-xl transition-all duration-300 ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-none shadow-indigo-500/20'
                                : 'glass-panel-lighter text-slate-200 rounded-tl-none border border-white/10 shadow-md'
                                }`}>
                                <div className={`font-bold text-[10px] mb-2 uppercase tracking-wider flex items-center ${msg.role === 'user' ? 'text-indigo-100' : 'text-slate-400'}`}>
                                    {msg.role === 'user' ? <User className="w-3 h-3 mr-1.5" /> : <Bot className="w-3 h-3 mr-1.5" />}
                                    {msg.role === 'user' ? 'You' : 'ATLAS AI'}
                                </div>
                                <div className="whitespace-pre-wrap leading-7 text-sm">{msg.text}</div>
                                {msg.role === 'model' && (
                                    <div className={`mt-3 pt-3 border-t border-white/10 text-[10px] flex items-center font-bold uppercase tracking-wide ${msg.grounded ? 'text-indigo-400' : 'text-emerald-400'}`}>
                                        {msg.grounded ? <><BookOpen className="w-3 h-3 mr-1.5" /> Syllabus Verified</> : <><Globe className="w-3 h-3 mr-1.5" /> General Knowledge</>}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {isLoading && (
                    <div className="flex justify-start animate-pulse">
                        <div className="glass-panel-lighter p-4 rounded-2xl rounded-tl-none border border-white/10 shadow-sm flex items-center space-x-3">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                            <span className="text-xs text-slate-400 font-bold tracking-wide">ANALYZING QUERY...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 glass-panel border-t border-white/10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.4)]">
                <form onSubmit={handleSendMessage} className="flex gap-3 max-w-5xl mx-auto relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isRagMode ? "Ask a syllabus question (e.g. 'Explain F=ma')..." : "Ask anything..."}
                        className="flex-grow p-4 pl-6 pr-14 bg-gray-800 border-2 border-transparent rounded-2xl focus:bg-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-white placeholder:text-slate-500 font-medium transition-all shadow-inner"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-2 bottom-2 aspect-square rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || !input.trim()}
                    >
                        <Send className="h-5 w-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENT 2: COLLEGE COMPASS (Unchanged Functionality) ---

const CollegeCompass = ({ retryableFetch }) => {
    const [activeTab, setActiveTab] = useState('career'); // career, college, chat
    const [formData, setFormData] = useState({ gpa: '', major: '', extracurriculars: '', location: '' });
    const [careerFormData, setCareerFormData] = useState({ hobbies: '', passion: '', field: '', aspirations: '' });
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState([{ role: 'model', text: "Hello! I'm your AI Future Architect. Let's design your career and find the perfect college." }]);
    const [structuredResult, setStructuredResult] = useState('');
    const [careerResult, setCareerResult] = useState('');
    const [citations, setCitations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, activeTab]);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleCareerInputChange = (e) => setCareerFormData({ ...careerFormData, [e.target.name]: e.target.value });

    const handleCareerSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setCareerResult('');

        const userQuery = `
            Analyze the following student interests and provide a high-level creative career roadmap.
            Hobbies: ${careerFormData.hobbies}
            Passion: ${careerFormData.passion}
            Current Field of Study: ${careerFormData.field}
            Future Aspirations: ${careerFormData.aspirations}

            Provide a detailed Markdown response with:
            1. Suggest a unique career path.
            2. Explain why it fits.
            3. A 3-step actionable roadmap.
            Use emojis and professional yet inspiring tone.
        `;

        try {
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: "You are a visionary Career Guidance Counselor. Provide creative, unique, and actionable career advice." }] }
            };
            const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
            const result = await retryableFetch(API_URL + `?key=${API_KEY}`, options);
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "No career path generated.";
            setCareerResult(text);
        } catch (err) {
            setError("Career AI Error: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStructuredSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setStructuredResult('');
        setCitations([]);

        const userQuery = `
            Analyze the following student profile and provide a detailed college recommendation.
            1. Recommend 2 'Safety/Good Fit' colleges, 2 'Target' colleges, and 1 'Reach' college.
            2. For each recommendation, state the estimated chance of acceptance.
            3. Justify based on the profile and current data.
            
            Profile: GPA ${formData.gpa}, Major ${formData.major}, Extra ${formData.extracurriculars}, Location ${formData.location}
        `;

        try {
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                tools: [{ "google_search": {} }],
                systemInstruction: { parts: [{ text: "You are a world-class College Admissions Counselor. Provide detailed, data-backed recommendations." }] }
            };
            const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
            const result = await retryableFetch(API_URL + `?key=${API_KEY}`, options);
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "No recommendation generated.";

            const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
            const sources = groundingMetadata?.groundingAttributions?.map(attr => ({
                uri: attr.web?.uri, title: attr.web?.title
            })).filter(s => s.uri && s.title) || [];

            setStructuredResult(text);
            setCitations(sources);
        } catch (err) {
            setError("College AI Error: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        const userMsg = chatInput.trim();
        setChatInput('');
        setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        const historyPayload = chatHistory.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] }));
        historyPayload.push({ role: 'user', parts: [{ text: userMsg }] });

        try {
            const payload = {
                contents: historyPayload,
                tools: [{ "google_search": {} }],
                systemInstruction: { parts: [{ text: "You are a friendly College Counselor AI. Provide helpful, data-grounded answers." }] }
            };
            const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
            const result = await retryableFetch(API_URL + `?key=${API_KEY}`, options);
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't find an answer.";
            setChatHistory(prev => [...prev, { role: 'model', text }]);
        } catch (err) {
            setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white relative overflow-y-auto custom-scrollbar">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -z-10" />

            <div className="p-8 text-center glass-panel border-b border-white/10 sticky top-0 z-20">
                <h2 className="text-3xl font-black text-white flex justify-center items-center tracking-tight mb-2">
                    <GraduationCap className="w-8 h-8 mr-3 text-indigo-400" />
                    COLLEGE COMPASS
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Next-Generation Educational Advisor</p>
            </div>

            <div className="p-4 md:p-8 max-w-5xl mx-auto w-full flex-1 flex flex-col">
                {/* Tabs */}
                <div className="flex mb-8 glass-panel-lighter p-1.5 rounded-2xl border border-white/10 shadow-lg animate-slide-up">
                    {[
                        { id: 'career', icon: <Sparkles className="w-4 h-4 mr-2" />, label: 'Career AI' },
                        { id: 'college', icon: <Map className="w-4 h-4 mr-2" />, label: 'College Finder' },
                        { id: 'chat', icon: <MessageSquare className="w-4 h-4 mr-2" />, label: 'Admissions Bot' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-8 animate-fade-in">
                    {activeTab === 'career' && (
                        <div className="space-y-8 animate-slide-up">
                            <form onSubmit={handleCareerSubmit} className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hobbies</label>
                                        <input name="hobbies" value={careerFormData.hobbies} onChange={handleCareerInputChange} required placeholder="e.g., Chess, Drawing" className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:bg-gray-700 outline-none transition" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Passion</label>
                                        <input name="passion" value={careerFormData.passion} onChange={handleCareerInputChange} required placeholder="e.g., Space Exploration" className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:bg-gray-700 outline-none transition" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Field</label>
                                        <input name="field" value={careerFormData.field} onChange={handleCareerInputChange} required placeholder="e.g., Grade 11 Science" className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:bg-gray-700 outline-none transition" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Future Aspirations</label>
                                        <input name="aspirations" value={careerFormData.aspirations} onChange={handleCareerInputChange} required placeholder="e.g., Become an Astrobiologist" className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:bg-gray-700 outline-none transition" />
                                    </div>
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-bold flex justify-center items-center shadow-lg disabled:opacity-50">
                                    {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : "Plan My Career"}
                                </button>
                            </form>
                            {careerResult && (
                                <div className="glass-panel p-8 rounded-3xl border border-white/10 animate-slide-up">
                                    <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed">
                                        {careerResult}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'college' && (
                        <div className="space-y-8 animate-slide-up">
                            <form onSubmit={handleStructuredSubmit} className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">GPA / Marks</label>
                                        <input name="gpa" value={formData.gpa} onChange={handleInputChange} required placeholder="e.g., 3.8 or 95%" className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:bg-gray-700 outline-none transition" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Major</label>
                                        <input name="major" value={formData.major} onChange={handleInputChange} required placeholder="e.g., Computer Science" className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:bg-gray-700 outline-none transition" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Extracurriculars</label>
                                    <textarea name="extracurriculars" value={formData.extracurriculars} onChange={handleInputChange} required rows="3" placeholder="Achievements, leadership..." className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:bg-gray-700 outline-none transition resize-none"></textarea>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location</label>
                                    <input name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g., USA, Europe" className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:bg-gray-700 outline-none transition" />
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold flex justify-center items-center shadow-lg disabled:opacity-50">
                                    {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : "Match My Colleges"}
                                </button>
                            </form>
                            {(structuredResult || error) && (
                                <div className="glass-panel p-8 rounded-3xl border border-white/10 animate-slide-up">
                                    {error ? (
                                        <div className="text-red-400 bg-red-900/20 p-4 rounded-xl border border-red-500/20">{error}</div>
                                    ) : (
                                        <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed">
                                            {structuredResult}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'chat' && (
                        <div className="flex flex-col glass-panel rounded-3xl border border-white/10 h-[600px] overflow-hidden animate-slide-up">
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'glass-panel-lighter border border-white/10 text-slate-200 rounded-tl-none'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && <Loader2 className="animate-spin w-5 h-5 text-indigo-400 self-start" />}
                                <div ref={chatEndRef} />
                            </div>
                            <form onSubmit={handleChatSubmit} className="p-4 glass-panel border-t border-white/10 flex gap-3">
                                <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask admissions questions..." className="flex-1 p-3 rounded-xl bg-gray-800 border border-gray-700 outline-none text-sm text-white focus:border-indigo-500" />
                                <button type="submit" disabled={isLoading || !chatInput.trim()} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg disabled:opacity-50"><Send className="w-5 h-5" /></button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT 3: QUIZ & ASSESSMENT (NEW INTERACTIVE VERSION) ---

const QuizAssessment = ({ retryableFetch }) => {
    const [step, setStep] = useState('form'); // 'form', 'taking', 'grading', 'graded'
    const [quizForm, setQuizForm] = useState({
        class: '10th Grade', subject: 'History', chapters: 'The Rise of Nationalism in Europe, Resources and Development',
        testType: 'Both', testSize: 'Full'
    });
    const [quizData, setQuizData] = useState(null); // { title: string, questions: [] }
    const [studentAnswers, setStudentAnswers] = useState({}); // { 1: 'A', 2: 'Student Answer Text' }
    const [gradingReport, setGradingReport] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFormChange = (e) => {
        setQuizForm({ ...quizForm, [e.target.name]: e.target.value });
    };

    const totalQuestions = quizData?.questions?.length || 0;
    const answeredCount = Object.keys(studentAnswers).filter(key => studentAnswers[key] && String(studentAnswers[key]).trim() !== '').length;

    // --- Step 1: Generate Quiz (JSON Structured Output) ---
    const generateQuiz = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setQuizData(null);
        setStudentAnswers({});

        const { class: grade, subject, chapters, testType, testSize } = quizForm;

        let objectiveCount = 0;
        let subjectiveCount = 0;

        if (testSize === 'Quick') {
            if (testType === 'Objective') objectiveCount = 4;
            else if (testType === 'Subjective') subjectiveCount = 3;
            else { objectiveCount = 3; subjectiveCount = 2; }
        } else { // Full
            if (testType === 'Objective') objectiveCount = 8;
            else if (testType === 'Subjective') subjectiveCount = 5;
            else { objectiveCount = 5; subjectiveCount = 3; }
        }

        const userQuery = `
          Generate a **${testSize} Test** for a student studying **${grade} ${subject}** based on the following topics/chapters: **${chapters}**.
          
          Instructions for Generation:
          1.  Generate exactly ${objectiveCount} objective (multiple choice) questions.
          2.  Generate exactly ${subjectiveCount} subjective (long answer) questions.
          3.  Assign 1 point for objective questions and 5-8 points for subjective questions.
          4.  Ensure the 'modelAnswer' for subjective questions is a detailed, correct response.
        `;

        const systemPrompt = "You are a highly structured educational assessment generator. Your only task is to generate a comprehensive quiz in the strict JSON format defined in the schema. Do not include any text outside the JSON object.";

        // Define the expected JSON structure
        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "title": { "type": "STRING", "description": "The title of the generated test." },
                    "instructions": { "type": "STRING", "description": "Brief instructions for the student." },
                    "questions": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "id": { "type": "INTEGER" },
                                "type": { "type": "STRING", "enum": ["objective", "subjective"] },
                                "questionText": { "type": "STRING" },
                                "points": { "type": "INTEGER" },
                                "options": { "type": "OBJECT", "description": "Only for objective type, keys A, B, C, D" },
                                "correctAnswer": { "type": "STRING", "description": "Only for objective type, key of the correct option (A, B, C, or D)" },
                                "modelAnswer": { "type": "STRING", "description": "Only for subjective type, the expected detailed answer for grading." }
                            },
                            "required": ["id", "type", "questionText", "points"]
                        }
                    }
                },
                required: ["title", "instructions", "questions"]
            }
        };

        try {
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: generationConfig
            };
            const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
            const result = await retryableFetch(API_URL + `?key=${API_KEY}`, options);

            const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!jsonText) throw new Error("API returned an empty response.");

            const parsedQuiz = JSON.parse(jsonText);

            setQuizData(parsedQuiz);
            setStep('taking');
        } catch (err) {
            console.error("Quiz Generation Error:", err);
            setError(`Failed to generate quiz. The model returned invalid data or an error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Step 3: Submit for Grading ---
    const submitQuizForGrading = async () => {
        if (!quizData) return;
        setStep('grading');
        setIsLoading(true);
        setError(null);
        setGradingReport('');

        // Prepare the submission data for the model
        const quizSummary = quizData.questions.map(q => {
            const studentAns = studentAnswers[q.id] || 'N/A';
            if (q.type === 'objective') {
                const isCorrect = studentAns === q.correctAnswer;
                return {
                    id: q.id,
                    type: q.type,
                    questionText: q.questionText,
                    correctAnswer: q.correctAnswer,
                    studentAnswer: studentAns,
                    result: isCorrect ? "Correct" : "Incorrect",
                    points: q.points
                };
            } else { // subjective
                return {
                    id: q.id,
                    type: q.type,
                    questionText: q.questionText,
                    modelAnswer: q.modelAnswer,
                    studentAnswer: studentAns,
                    points: q.points
                };
            }
        });

        const totalPointsPossible = quizData.questions.reduce((sum, q) => sum + q.points, 0);

        const userQuery = `
          GRADE THIS STUDENT ASSESSMENT AND PROVIDE PERSONALIZED TUTORING FEEDBACK.
          
          Quiz Title: ${quizData.title}
          Total Points Possible: ${totalPointsPossible}
          
          --- ASSESSMENT DATA ---
          ${JSON.stringify(quizSummary, null, 2)}
          --- END DATA ---

          Your task is to act as a world-class AI tutor. Provide a detailed, conversational report using markdown:
          1.  **Summary:** Calculate the total score and present it clearly.
          2.  **Objective Analysis:** Briefly summarize the performance on MCQs.
          3.  **Subjective Critique:** Critically grade each subjective question (ID, points received/possible) based on comparing the 'studentAnswer' to the 'modelAnswer'. Explain why points were deducted.
          4.  **Actionable Feedback:** Provide 3-5 specific, actionable suggestions for improvement (e.g., "Review Chapter 3 concepts related to X," "Focus on precise definitions for Y").
        `;

        const systemPrompt = "You are ATLAS, an expert educational tutor. Grade the provided assessment data rigorously and generate a personalized, motivational, and highly detailed critique in Markdown format. Your response must only be the report itself, without any introductory or concluding conversational text.";

        try {
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };
            const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
            const result = await retryableFetch(API_URL + `?key=${API_KEY}`, options);
            const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to generate detailed grading report.";
            setGradingReport(generatedText);
            setStep('graded');
        } catch (err) {
            console.error("Grading Error:", err);
            setError("Failed to grade the quiz. Please try again.");
            setStep('taking'); // Go back to taking step
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Helpers ---

    const QuizForm = () => (
        <form onSubmit={generateQuiz} className="glass-panel p-6 rounded-3xl shadow-xl border border-white/10 space-y-6 relative overflow-hidden h-fit md:sticky md:top-24 animate-slide-up">
            <div className="absolute top-0 left-0 w-2 h-full bg-purple-500" />

            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-3">Test Parameters</h3>

            <div className="grid grid-cols-2 gap-4">
                <div className='space-y-2'>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Class/Grade</label>
                    <input name="class" value={quizForm.class} onChange={handleFormChange} required placeholder="e.g., 10th Grade"
                        className="w-full p-3 rounded-xl border border-gray-700 bg-gray-800 focus:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition font-medium text-white placeholder:text-slate-500"
                    />
                </div>
                <div className='space-y-2'>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Subject</label>
                    <input name="subject" value={quizForm.subject} onChange={handleFormChange} required placeholder="e.g., Physics"
                        className="w-full p-3 rounded-xl border border-gray-700 bg-gray-800 focus:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition font-medium text-white placeholder:text-slate-500"
                    />
                </div>
            </div>

            <div className='space-y-2'>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Chapters/Topics</label>
                <textarea name="chapters" value={quizForm.chapters} onChange={handleFormChange} required rows="3" placeholder="List chapters, separated by commas..."
                    className="w-full p-3 rounded-xl border border-gray-700 bg-gray-800 focus:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition font-medium text-white placeholder:text-slate-500"
                />
            </div>

            <div className='space-y-2'>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block">Test Type</label>
                <div className="flex justify-between space-x-2">
                    {['Objective', 'Subjective', 'Both'].map(type => (
                        <label key={type} className={`flex-1 text-center cursor-pointer py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${quizForm.testType === type
                            ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20'
                            : 'bg-gray-800 text-slate-400 border-gray-700 hover:bg-gray-700'
                            }`}>
                            <input type="radio" name="testType" value={type} checked={quizForm.testType === type} onChange={handleFormChange} className="hidden" />
                            {type}
                        </label>
                    ))}
                </div>
            </div>

            <div className='space-y-2'>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block">Test Size</label>
                <div className="flex justify-between space-x-2">
                    {['Quick', 'Full'].map(size => (
                        <label key={size} className={`flex-1 text-center cursor-pointer py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${quizForm.testSize === size
                            ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20'
                            : 'bg-gray-800 text-slate-400 border-gray-700 hover:bg-gray-700'
                            }`}>
                            <input type="radio" name="testSize" value={size} checked={quizForm.testSize === size} onChange={handleFormChange} className="hidden" />
                            {size}
                        </label>
                    ))}
                </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:scale-[1.01] transition-all flex justify-center items-center disabled:opacity-50 disabled:scale-100">
                {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : "Generate New Assessment"}
            </button>
            {error && <p className="text-red-400 text-sm mt-3 flex items-center"><AlertTriangle className='w-4 h-4 mr-2' />{error}</p>}
        </form>
    );

    const QuizTaker = () => {
        const handleAnswerChange = (qId, value) => {
            setStudentAnswers(prev => ({ ...prev, [qId]: value }));
        };

        const questionList = quizData.questions || [];

        return (
            <div className="space-y-8">
                <div className="flex items-center justify-between glass-panel-lighter p-4 rounded-xl border border-white/10 sticky top-0 z-10 shadow-lg">
                    <h3 className="text-xl font-bold text-white">{quizData.title}</h3>
                    <div className="text-sm font-medium text-slate-400">
                        {answeredCount}/{totalQuestions} Answered
                    </div>
                </div>

                <div className='p-6 glass-panel rounded-xl'>
                    <p className="text-slate-400 italic mb-6">{quizData.instructions}</p>
                    <div className='space-y-10'>
                        {questionList.map((q, index) => (
                            <div key={q.id} className="p-4 rounded-lg border-l-4 border-purple-500 bg-gray-800/50 shadow-md">
                                <p className="font-semibold text-lg text-white mb-3">
                                    Q{index + 1}. ({q.points} Points): {q.questionText}
                                </p>

                                {q.type === 'objective' ? (
                                    // Objective Question (Radio Buttons)
                                    <div className="space-y-2 pt-2">
                                        {Object.keys(q.options).map(key => (
                                            <label key={key} className={`flex items-start p-3 rounded-lg cursor-pointer transition-colors ${studentAnswers[q.id] === key
                                                ? 'bg-purple-700/50 text-white border border-purple-500'
                                                : 'hover:bg-gray-700/50 text-slate-300'
                                                }`}>
                                                <input
                                                    type="radio"
                                                    name={`q-${q.id}`}
                                                    value={key}
                                                    checked={studentAnswers[q.id] === key}
                                                    onChange={() => handleAnswerChange(q.id, key)}
                                                    className="mt-1 mr-3 h-5 w-5 appearance-none rounded-full border border-slate-500 checked:bg-purple-500 checked:border-purple-500 focus:outline-none"
                                                    style={{ transition: 'all 0.15s ease-in-out', boxShadow: studentAnswers[q.id] === key ? '0 0 0 3px rgba(168, 85, 247, 0.4)' : 'none' }}
                                                />
                                                <span className="font-medium">**{key}.** {q.options[key]}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    // Subjective Question (Textarea)
                                    <textarea
                                        rows="5"
                                        value={studentAnswers[q.id] || ''}
                                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                        placeholder="Type your detailed answer here..."
                                        className="w-full p-4 mt-3 rounded-lg border border-gray-700 bg-gray-700/50 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none resize-none text-white transition"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={submitQuizForGrading}
                    disabled={answeredCount === 0 || isLoading}
                    className="w-full py-4 bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-pink-500/30 hover:shadow-2xl hover:scale-[1.01] transition-all flex justify-center items-center disabled:opacity-50 disabled:scale-100"
                >
                    <Brain className='w-5 h-5 mr-3' />
                    Submit for AI Grading & Report ({answeredCount}/{totalQuestions} Answered)
                </button>
            </div>
        );
    };

    const GradingReport = () => (
        <div className="animate-slide-up space-y-8">
            <button
                onClick={() => setStep('form')}
                className="flex items-center text-purple-400 hover:text-white transition font-medium mb-4"
            >
                <ArrowLeft className='w-4 h-4 mr-2' /> Start New Test
            </button>

            <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-white/10">
                <h3 className="text-3xl font-extrabold text-pink-400 mb-6 flex items-center border-b border-white/10 pb-4">
                    <UserCheck className="w-8 h-8 mr-3 fill-pink-900" />
                    ATLAS Personalized Grading Report
                </h3>

                {isLoading ? (
                    <div className='flex flex-col items-center justify-center h-64 text-slate-400'>
                        <Loader2 className="w-8 h-8 animate-spin text-pink-400 mb-4" />
                        <p className="font-semibold text-lg">Generating your detailed critique...</p>
                        <p className="text-sm">The AI is scoring your answers and formulating feedback.</p>
                    </div>
                ) : (
                    <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                        <style>{`
                            .prose h1, .prose h2, .prose h3 { color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; margin-top: 1.5rem; }
                            .prose h2 { color: #f9a8d4; }
                            .prose ol li:before { color: #a78bfa; font-weight: bold; }
                            .prose ul { list-style-type: disc; }
                        `}</style>
                        <div dangerouslySetInnerHTML={{ __html: gradingReport }} />
                    </div>
                )}
            </div>
        </div>
    );

    const getRenderContent = () => {
        switch (step) {
            case 'form':
                return (
                    <div className="flex flex-col md:flex-row gap-8 w-full">
                        <div className='md:w-1/3'><QuizForm /></div>
                        <div className="md:w-2/3 flex-1">
                            <div className='glass-panel p-6 rounded-3xl shadow-xl border border-white/10 min-h-full flex flex-col items-center justify-center h-64 text-slate-500'>
                                <FileText className="w-12 h-12 text-slate-600 mb-4" />
                                <p className="font-semibold text-lg">Define your test parameters</p>
                                <p className="text-sm">Fill out the form on the left to create a practice assessment.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'taking':
                return <QuizTaker />;
            case 'grading':
            case 'graded':
                return <GradingReport />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white relative overflow-y-auto custom-scrollbar">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-3xl -z-10 pointer-events-none" />

            <div className="p-8 text-center glass-panel border-b border-white/10 shadow-xl sticky top-0 z-20">
                <h2 className="text-3xl font-extrabold text-white flex justify-center items-center tracking-tight mb-2">
                    <FileText className="w-8 h-8 mr-3 text-purple-400 drop-shadow-sm" />
                    Quiz & Assessment Generator
                </h2>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Interactive AI-Graded Practice</p>
            </div>

            <div className="p-4 md:p-8 max-w-6xl mx-auto w-full flex-1">
                {getRenderContent()}
            </div>
        </div>
    );
};


// --- MAIN APP SHELL ---

const App = () => {
    const [currentView, setCurrentView] = useState('doubt-solver');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
    const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse state (NEW)
    const [isLoading, setIsLoading] = useState(true); // Added for splash screen
    const retryableFetch = useRetryableFetch();

    // Simulate Splash Screen completion
    useEffect(() => {
        // Simulate auth check/splash completion
        setTimeout(() => {
            setIsLoading(false);
        }, 3000);
    }, []);


    const Sidebar = ({ isCollapsed, setIsCollapsed }) => (
        // Conditional width for collapsed state
        <div
            className={`
        fixed inset-y-0 left-0 
        transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 
        transition-all duration-300 ease-in-out 
        bg-gray-900 text-slate-300 z-50 shadow-2xl flex flex-col border-r border-gray-700/50
        ${isCollapsed ? 'md:w-20' : 'md:w-72 w-72'} 
      `}
        >

            {/* Header/Logo Section */}
            <div className={`p-4 ${isCollapsed ? 'py-4 px-3' : 'py-8 px-5'} flex items-center justify-between border-b border-gray-800/50 bg-gray-900 transition-all duration-300`}>
                <h1 className={`text-2xl font-black tracking-tighter text-white flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20 flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    {/* Hide ATLAS text when collapsed */}
                    <span className={isCollapsed ? 'hidden' : 'block transition-opacity'}>ATLAS</span>
                </h1>

                {/* Mobile close button */}
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white transition"><X /></button>
            </div>

            <nav className="flex-1 p-4 space-y-2 mt-2 overflow-y-auto custom-scrollbar">
                {/* Hide Title when collapsed */}
                {!isCollapsed && (
                    <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Core Modules</div>
                )}

                {/* Doubt Solver Button */}
                <button
                    onClick={() => { setCurrentView('doubt-solver'); setIsSidebarOpen(false); }}
                    className={`w-full text-left py-3.5 rounded-xl flex items-center transition-all duration-200 group ${isCollapsed ? 'px-3 justify-center' : 'px-4'} ${currentView === 'doubt-solver'
                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner'
                        : 'hover:bg-gray-800/50 hover:text-white border border-transparent'
                        }`}
                >
                    <Bot className={`w-5 h-5 flex-shrink-0 transition-colors ${isCollapsed ? '' : 'mr-3'} ${currentView === 'doubt-solver' ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    {/* Hide text when collapsed */}
                    {!isCollapsed && (
                        <span className="font-semibold flex-grow">Doubt Solver</span>
                    )}
                    {currentView === 'doubt-solver' && <div className={`flex-shrink-0 ${isCollapsed ? '' : 'ml-auto'} w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]`} />}
                </button>

                {/* College Compass Button */}
                <button
                    onClick={() => { setCurrentView('college-compass'); setIsSidebarOpen(false); }}
                    className={`w-full text-left py-3.5 rounded-xl flex items-center transition-all duration-200 group ${isCollapsed ? 'px-3 justify-center' : 'px-4'} ${currentView === 'college-compass'
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-inner'
                        : 'hover:bg-gray-800/50 hover:text-white border border-transparent'
                        }`}
                >
                    <GraduationCap className={`w-5 h-5 flex-shrink-0 transition-colors ${isCollapsed ? '' : 'mr-3'} ${currentView === 'college-compass' ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    {!isCollapsed && (
                        <span className="font-semibold flex-grow">College Compass</span>
                    )}
                    {currentView === 'college-compass' && <div className={`flex-shrink-0 ${isCollapsed ? '' : 'ml-auto'} w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]`} />}
                </button>

                {/* Quiz & Assessment Button */}
                <button
                    onClick={() => { setCurrentView('quiz-assessment'); setIsSidebarOpen(false); }}
                    className={`w-full text-left py-3.5 rounded-xl flex items-center transition-all duration-200 group ${isCollapsed ? 'px-3 justify-center' : 'px-4'} ${currentView === 'quiz-assessment'
                        ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20 shadow-inner'
                        : 'hover:bg-gray-800/50 hover:text-white border border-transparent'
                        }`}
                >
                    <ClipboardList className={`w-5 h-5 flex-shrink-0 transition-colors ${isCollapsed ? '' : 'mr-3'} ${currentView === 'quiz-assessment' ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    {!isCollapsed && (
                        <span className="font-semibold flex-grow">Quiz & Assessment</span>
                    )}
                    {currentView === 'quiz-assessment' && <div className={`flex-shrink-0 ${isCollapsed ? '' : 'ml-auto'} w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]`} />}
                </button>

            </nav>

            {/* Footer/Collapse Toggle */}
            <div className={`p-4 border-t border-gray-800/50 ${isCollapsed ? 'px-3' : 'px-5'}`}>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-2 rounded-xl text-slate-400 hover:bg-gray-800/50 hover:text-white transition-all`}
                >
                    {!isCollapsed && <span className="text-sm font-medium">Collapse Menu</span>}
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5" />
                    ) : (
                        <ChevronLeft className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-900 font-sans overflow-hidden">
            <style>{styles}</style>

            {/* Global Background Decoration */}
            <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full blur-[128px] -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[128px] translate-x-1/2 -translate-y-1/2"></div>
            </div>

            {isLoading && <SplashScreen onComplete={() => setIsLoading(false)} />}

            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            {/* Main Content Area - Adjust margin based on collapsed state */}
            <div className={`flex-1 flex flex-col h-full relative glass-panel rounded-l-[40px] shadow-2xl overflow-hidden my-0 md:my-2 ${isCollapsed ? 'md:ml-0 md:mr-2' : 'md:ml-0 md:mr-2'} border border-white/10 transition-all duration-300`}>
                {/* Mobile Header */}
                <header className="md:hidden glass-panel p-4 shadow-xl flex items-center justify-between z-30 sticky top-0 border-b border-white/10">
                    <div className="flex items-center">
                        <button onClick={() => setIsSidebarOpen(true)} className="mr-3 text-slate-400 hover:text-white transition"><Menu /></button>
                        <h1 className="font-bold text-white flex items-center">
                            {currentView === 'doubt-solver' ? <Bot className="w-5 h-5 mr-2 text-indigo-400" /> :
                                currentView === 'college-compass' ? <GraduationCap className="w-5 h-5 mr-2 text-blue-400" /> :
                                    <FileText className="w-5 h-5 mr-2 text-purple-400" />
                            }
                            {currentView === 'doubt-solver' ? 'Doubt Solver' : currentView === 'college-compass' ? 'College Compass' : 'Assessment'}
                        </h1>
                    </div>
                </header>

                {/* Main Content with View Transition */}
                <main className="flex-1 overflow-hidden relative">
                    <div key={currentView} className="h-full animate-view-transition">
                        {currentView === 'doubt-solver' ? (
                            <DoubtSolver retryableFetch={retryableFetch} />
                        ) : currentView === 'college-compass' ? (
                            <CollegeCompass retryableFetch={retryableFetch} />
                        ) : (
                            <QuizAssessment retryableFetch={retryableFetch} />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;