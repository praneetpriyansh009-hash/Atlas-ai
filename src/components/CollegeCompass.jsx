import React, { useState, useEffect, useRef } from 'react';
import { ClipboardList, MessageSquare, Loader2, Lightbulb, Link, Globe, Send, Sparkles, Brain, Trophy, MapPin, GraduationCap, Map } from './Icons';
import { useTheme } from '../contexts/ThemeContext';
import { GROQ_API_URL, formatGroqPayload } from '../utils/api';

const CollegeCompass = ({ retryableFetch }) => {
    const { isDark } = useTheme();
    const [activeTab, setActiveTab] = useState('career'); // career, college, chat
    const [formData, setFormData] = useState({ gpa: '', major: '', extracurriculars: '', location: '' });
    const [careerFormData, setCareerFormData] = useState({ hobbies: '', passion: '', field: '', aspirations: '' });
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState([{ role: 'model', text: "Hello! I'm your AI College Counselor. Ask me anything about university admissions, programs, or career paths. I use real-time data to give you accurate recommendations." }]);
    const [structuredResult, setStructuredResult] = useState('');
    const [careerResult, setCareerResult] = useState('');
    const [citations, setCitations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const chatEndRef = useRef(null);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);
    useEffect(() => { const timer = setTimeout(() => setShowIntro(false), 800); return () => clearTimeout(timer); }, []);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleCareerInputChange = (e) => setCareerFormData({ ...careerFormData, [e.target.name]: e.target.value });

    const handleCareerSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setCareerResult('');

        const userQuery = `
            Analyze the following student interests and provide a creative career roadmap.
            Hobbies: ${careerFormData.hobbies}
            Passion: ${careerFormData.passion}
            Current Field of Study: ${careerFormData.field}
            Future Aspirations: ${careerFormData.aspirations}

            Please provide:
            1. **Suggested Career Path**: A unique career that combines these interests.
            2. **Why this fits**: Explanation based on their passion and hobbies.
            3. **Step-by-Step Roadmap**: How to achieve this career (Education, Skills, Experience).
            4. **Industry Outlook**: Future prospects for this path.
            5. **Creative Encouragement**: A short, inspiring message.
            
            Format the response using beautiful Markdown with emojis and clear sections.
        `;

        try {
            const payload = {
                model: "llama-3.1-8b-instant",
                ...formatGroqPayload(
                    userQuery,
                    "You are a creative and visionary Career Guidance Counselor. Your goal is to inspire students and provide practical, data-backed roadmaps for unique career paths that blend their diverse interests."
                )
            };
            const result = await retryableFetch(GROQ_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const text = result.choices?.[0]?.message?.content || "No career path generated.";
            setCareerResult(text);
        } catch (err) {
            setCareerResult("Career AI Error: " + err.message);
        } finally { setIsLoading(false); }
    };

    const handleStructuredSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStructuredResult('');
        setCitations([]);

        const userQuery = `
            Analyze the following student profile and provide a detailed college recommendation.
            1. Recommend 2 'Safety/Good Fit' colleges, 2 'Target' colleges, and 1 'Reach' college.
            2. For each recommendation, state the estimated chance of acceptance (High, Medium, Low).
            3. Justify the recommendation based on the profile and real-world acceptance data.
            4. Use the current year's data for all metrics.

            --- STUDENT PROFILE ---
            GPA/Marks: ${formData.gpa}
            Desired Major: ${formData.major}
            Extracurriculars: ${formData.extracurriculars}
            Preferred Location: ${formData.location || 'No strong preference'}
            --- END PROFILE ---
        `;

        try {
            const payload = {
                model: "llama-3.1-8b-instant",
                ...formatGroqPayload(
                    userQuery,
                    "You are a world-class College Admissions Counselor. Your response must be detailed, structured using Markdown, and based on verified data. Be professional and encouraging."
                )
            };
            const result = await retryableFetch(GROQ_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const text = result.choices?.[0]?.message?.content || "No recommendation generated.";
            const sources = result.groundingMetadata?.groundingAttributions?.map(attr => ({
                uri: attr.web?.uri,
                title: attr.web?.title
            })).filter(s => s.uri && s.title) || [];

            setStructuredResult(text);
            setCitations(sources);
        } catch (err) {
            setStructuredResult("College Compass AI Error: " + err.message);
        } finally { setIsLoading(false); }
    };

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        const userMsg = chatInput.trim();
        setChatInput('');
        setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        const historyText = chatHistory.map(m => `${m.role === 'user' ? 'Student' : 'Counselor'}: ${m.text}`).join('\n');
        const finalPrompt = `${historyText}\nStudent: ${userMsg}`;

        try {
            const payload = {
                model: "llama-3.1-8b-instant",
                ...formatGroqPayload(
                    finalPrompt,
                    "You are a friendly College Counselor AI. Provide concise answers grounded in data. Use Markdown for readability (lists, bolding)."
                )
            };
            const result = await retryableFetch(GROQ_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const text = result.choices?.[0]?.message?.content || "I couldn't find an answer.";
            setChatHistory(prev => [...prev, { role: 'model', text }]);
        } catch (err) {
            setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error with College Compass AI." }]);
        } finally { setIsLoading(false); }
    };

    return (
        <div className={`flex flex-col h-full ${isDark ? 'bg-gray-900 text-white' : 'bg-warm-100 text-gray-900'} relative overflow-y-auto custom-scrollbar transition-colors duration-300`}>
            {/* Background Decorations */}
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] ${isDark ? 'bg-indigo-600/10' : 'bg-indigo-400/10'} rounded-full blur-[120px] -z-10`} />
            <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] ${isDark ? 'bg-blue-600/10' : 'bg-blue-400/10'} rounded-full blur-[120px] -z-10`} />

            {/* Header */}
            <div className={`p-8 text-center glass-panel sticky top-0 z-30 shadow-lg border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg">
                        <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent tracking-tight">
                        COLLEGE COMPASS
                    </h2>
                </div>
                <p className={`text-xs font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-theme-muted'}`}>
                    AI-Driven Future Architecture
                </p>
            </div>

            <div className="p-4 md:p-8 max-w-5xl mx-auto w-full flex-1">
                {/* Navigation Tabs */}
                <div className={`flex p-1.5 glass-panel-lighter rounded-2xl mb-8 shadow-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} animate-slide-up`}>
                    {[
                        { id: 'career', icon: <Sparkles className="w-4 h-4" />, label: 'Career AI' },
                        { id: 'college', icon: <Map className="w-4 h-4" />, label: 'College Finder' },
                        { id: 'chat', icon: <MessageSquare className="w-4 h-4" />, label: 'Admissions Bot' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30 transform scale-[1.02]'
                                : `${isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`
                                }`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Section Content */}
                <div className="space-y-8">
                    {activeTab === 'career' && (
                        <div className="animate-fade-in space-y-8">
                            <form onSubmit={handleCareerSubmit} className={`glass-panel p-8 rounded-3xl shadow-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'} relative overflow-hidden group`}>
                                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-blue-600" />
                                <div className="flex items-center gap-3 mb-8">
                                    <Brain className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                                    <h3 className="text-xl font-bold text-theme-primary">Discover Your Path</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-theme-muted'} ml-1`}>Hobbies & Interests</label>
                                        <input
                                            name="hobbies"
                                            value={careerFormData.hobbies}
                                            onChange={handleCareerInputChange}
                                            required
                                            placeholder="e.g. Painting, coding, gaming..."
                                            className={`w-full p-4 rounded-xl ${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'} border focus:border-indigo-500 outline-none transition-all`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-theme-muted'} ml-1`}>Deep Passions</label>
                                        <input
                                            name="passion"
                                            value={careerFormData.passion}
                                            onChange={handleCareerInputChange}
                                            required
                                            placeholder="e.g. Climate change, AI ethics..."
                                            className={`w-full p-4 rounded-xl ${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'} border focus:border-indigo-500 outline-none transition-all`}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-theme-muted'} ml-1`}>Current Study Field</label>
                                        <input
                                            name="field"
                                            value={careerFormData.field}
                                            onChange={handleCareerInputChange}
                                            required
                                            placeholder="e.g. High School Science, Arts..."
                                            className={`w-full p-4 rounded-xl ${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'} border focus:border-indigo-500 outline-none transition-all`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-theme-muted'} ml-1`}>Future Aspirations</label>
                                        <input
                                            name="aspirations"
                                            value={careerFormData.aspirations}
                                            onChange={handleCareerInputChange}
                                            required
                                            placeholder="e.g. Lead a tech startup..."
                                            className={`w-full p-4 rounded-xl ${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'} border focus:border-indigo-500 outline-none transition-all`}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex justify-center items-center disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Architect My Career Path"}
                                </button>
                            </form>

                            {careerResult && (
                                <div className={`glass-panel p-8 rounded-3xl shadow-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'} animate-slide-up`}>
                                    <div className={`flex items-center gap-3 mb-6 pb-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                        <Sparkles className={`w-6 h-6 ${isDark ? 'text-yellow-400' : 'text-amber-500'}`} />
                                        <h3 className="text-xl font-bold text-theme-primary">Personal Career Roadmap</h3>
                                    </div>
                                    <div className={`prose ${isDark ? 'prose-invert text-slate-300' : 'prose-slate text-theme-secondary'} max-w-none prose-sm leading-relaxed`}>
                                        {careerResult.split('\n').map((line, i) => (
                                            <p key={i}>{line}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'college' && (
                        <div className="animate-fade-in space-y-8">
                            <form onSubmit={handleStructuredSubmit} className={`glass-panel p-8 rounded-3xl shadow-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'} relative overflow-hidden group`}>
                                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 to-cyan-500" />
                                <div className="flex items-center gap-3 mb-8">
                                    <Trophy className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                    <h3 className="text-xl font-bold text-theme-primary">College Profile Analysis</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-theme-muted'} ml-1`}>GPA / Marks</label>
                                        <input
                                            name="gpa"
                                            value={formData.gpa}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g. 3.9/4.0"
                                            className={`w-full p-4 rounded-xl ${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'} border focus:border-blue-500 outline-none transition-all`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-theme-muted'} ml-1`}>Target Major</label>
                                        <input
                                            name="major"
                                            value={formData.major}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g. Aerospace Engineering"
                                            className={`w-full p-4 rounded-xl ${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'} border focus:border-blue-500 outline-none transition-all`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-theme-muted'} ml-1`}>Extracurriculars</label>
                                    <textarea
                                        name="extracurriculars"
                                        value={formData.extracurriculars}
                                        onChange={handleInputChange}
                                        required
                                        rows="3"
                                        placeholder="Projects, leadership, impact..."
                                        className={`w-full p-4 rounded-xl ${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'} border focus:border-blue-500 outline-none transition-all resize-none`}
                                    />
                                </div>

                                <div className="space-y-2 mb-8">
                                    <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-theme-muted'} ml-1`}>Preferred Location</label>
                                    <div className="relative">
                                        <MapPin className={`absolute left-4 top-4 w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                        <input
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            placeholder="e.g. East Coast, Europe"
                                            className={`w-full p-4 pl-12 rounded-xl ${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'} border focus:border-blue-500 outline-none transition-all`}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex justify-center items-center disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Match My Colleges"}
                                </button>
                            </form>

                            {structuredResult && (
                                <div className={`glass-panel p-8 rounded-3xl shadow-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'} animate-slide-up`}>
                                    <div className={`flex items-center gap-3 mb-6 pb-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                        <Lightbulb className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                        <h3 className="text-xl font-bold text-theme-primary">College Recommendations</h3>
                                    </div>
                                    <div className={`prose ${isDark ? 'prose-invert text-slate-300' : 'prose-slate text-theme-secondary'} max-w-none whitespace-pre-wrap leading-relaxed`}>
                                        {structuredResult}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'chat' && (
                        <div className={`animate-fade-in flex flex-col glass-panel rounded-3xl shadow-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'} h-[600px] overflow-hidden`}>
                            <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} flex items-center gap-3 ${isDark ? 'bg-white/5' : 'bg-white/50'}`}>
                                <MessageSquare className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                                <span className={`font-bold text-sm ${isDark ? '' : 'text-theme-primary'}`}>Admissions Assistant</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                            ? 'bg-gradient-to-tr from-indigo-600 to-blue-600 text-white rounded-br-none'
                                            : `${isDark ? 'bg-white/5 border-white/10 text-slate-200' : 'bg-white border-gray-200 text-theme-secondary shadow-inner'} border rounded-tl-none`
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} p-4 rounded-2xl rounded-tl-none border flex items-center gap-2`}>
                                            <Loader2 className={`w-4 h-4 animate-spin ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                                            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Processing...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={handleChatSubmit} className={`p-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} border-t flex gap-3`}>
                                <input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask anything about colleges..."
                                    className={`flex-1 p-4 rounded-xl ${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'} outline-none focus:border-indigo-500 border transition-all text-sm`}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !chatInput.trim()}
                                    className="p-4 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CollegeCompass;

