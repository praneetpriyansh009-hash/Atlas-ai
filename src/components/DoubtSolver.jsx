import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, User, Bot, Loader2, Send, BookOpen, Clock, BrainCircuit } from './Icons';
import { useTheme } from '../contexts/ThemeContext';
import { GROQ_API_URL } from '../utils/api';

const DoubtSolver = ({ retryableFetch }) => {
    const { isDark } = useTheme();
    const [messages, setMessages] = useState([{
        role: 'assistant',
        content: "Hello! I'm ATLAS, your AI study companion. Ask me anything about your subjects, and I'll help you understand it clearly!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userQuestion = input.trim();
        setInput('');

        // Add user message to state
        const newMessage = {
            role: 'user',
            content: userQuestion,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMessage]);
        setIsLoading(true);

        // --- IMPROVED SYSTEM PROMPT ---
        let systemPrompt = `You are ATLAS, an advanced AI study companion designed to be accurate, concise, and logical.

        CORE INSTRUCTIONS:
        1. **Direct Answer**: Start with a direct answer to the user's question. Avoid meta-commentary like "Here is the answer".
        2. **Logical Consistency**: Ensure your explanation flows logically. Do not contradict yourself.
        3. **Tone**: Professional yet encouraging. Avoid flowery or overly dramatic language.
        4. **Formatting**: Use bold terms for key concepts and bullet points for lists.
        5. **Context Check**: If syllabus context is provided below, use it ONLY if it directly answers the question. If the context is irrelevant to the specific question, ignore it and answer from general knowledge.

        STRICT PROHIBITIIONS:
        - Do not hallucinate facts.
        - Do not provide irrational or disjointed statements.
        - Do not apologize excessively.`;

        let context = "";
        let isSyllabusVerified = false;

        try {
            // RAG Disabled by user request.
            // Proceeding with direct LLM query.

            // Build payload for Groq
            // Build payload for Groq with HISTORY
            // Convert existing messages to API format
            const conversationHistory = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const payload = {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...conversationHistory,
                    { role: 'user', content: userQuestion }
                ]
            };

            const result = await retryableFetch(GROQ_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (result.error) throw new Error(result.error);

            const responseText = result.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: responseText,
                isSyllabusVerified,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Error details: ${err.message}`, // Expose error for debugging
                isError: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex flex-col h-full ${isDark ? 'bg-midnight-900' : 'bg-warm-50'} text-theme-primary relative overflow-hidden transition-colors duration-300 font-sans scene-3d`}>
            {/* 3D Floating Elements Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Cube 1 */}
                <div className="cube-3d opacity-20 left-[10%] top-[20%]">
                    <div className="cube-face cube-face-front"></div>
                    <div className="cube-face cube-face-back"></div>
                    <div className="cube-face cube-face-right"></div>
                    <div className="cube-face cube-face-left"></div>
                    <div className="cube-face cube-face-top"></div>
                    <div className="cube-face cube-face-bottom"></div>
                </div>
                {/* Cube 2 */}
                <div className="cube-3d opacity-20 right-[15%] bottom-[30%] animation-delay-2000">
                    <div className="cube-face cube-face-front"></div>
                    <div className="cube-face cube-face-back"></div>
                    <div className="cube-face cube-face-right"></div>
                    <div className="cube-face cube-face-left"></div>
                    <div className="cube-face cube-face-top"></div>
                    <div className="cube-face cube-face-bottom"></div>
                </div>

                <div className={`absolute top-0 right-0 w-[800px] h-[800px] ${isDark ? 'bg-brand-primary/5' : 'bg-brand-primary/5'} rounded-full blur-[120px] -z-10 translate-x-1/3 -translate-y-1/3`} />
                <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] ${isDark ? 'bg-brand-secondary/5' : 'bg-brand-secondary/5'} rounded-full blur-[100px] -z-10 -translate-x-1/3 translate-y-1/3`} />
            </div>

            {/* Header */}
            <div className={`px-6 py-4 glass-panel sticky top-0 z-30 flex items-center justify-between border-b ${isDark ? 'border-white/5' : 'border-black/5'} shadow-sm`}>
                <div className="flex items-center">
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-brand-primary/20 text-brand-primary' : 'bg-brand-primary/10 text-brand-primary'} mr-4 shadow-sm backdrop-blur-md`}>
                        <BrainCircuit className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-display font-bold text-theme-primary tracking-tight">ATLAS Intelligence</h2>
                        <div className="flex items-center mt-0.5">
                            <span className="flex w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                            <p className="text-[10px] font-medium text-theme-muted uppercase tracking-wider">Systems v3.0</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area - Fixed Layout */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar scroll-smooth z-10">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex w-full animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                            {/* Sender Info - Compact */}
                            <div className="flex items-center mb-1.5 px-1 opacity-70 hover:opacity-100 transition-opacity">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-theme-muted' : 'text-brand-primary'}`}>
                                    {msg.role === 'user' ? 'You' : 'Atlas'}
                                </span>
                                <span className="mx-2 text-[10px] text-theme-muted/50">•</span>
                                <span className="flex items-center text-[10px] text-theme-muted">
                                    {msg.timestamp}
                                </span>
                            </div>

                            {/* Message Bubble - Refined */}
                            <div className={`relative p-5 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-brand-primary to-indigo-600 text-white rounded-tr-none'
                                : `${isDark ? 'bg-midnight-800/80 border-white/10' : 'bg-white/80 border-warm-200'} border text-theme-primary rounded-tl-none backdrop-blur-md`
                                }`}>

                                {msg.isSyllabusVerified && (
                                    <div className="mb-2 inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                                        <BookOpen className="w-3 h-3 mr-1.5" /> Context Verified
                                    </div>
                                )}

                                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert text-white/95' : 'text-theme-secondary'} font-sans leading-relaxed`}>
                                    <div className="whitespace-pre-wrap text-[15px]">{msg.content}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start animate-fade-in pl-2">
                        <div className={`p-4 rounded-2xl rounded-tl-none ${isDark ? 'bg-midnight-800/50' : 'bg-white/50'} flex items-center space-x-2`}>
                            <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce delay-100"></div>
                            <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Grounded & Compact */}
            <div className={`p-4 z-20 ${isDark ? 'bg-midnight-900/80' : 'bg-warm-50/80'} backdrop-blur-xl border-t ${isDark ? 'border-white/5' : 'border-black/5'} sticky bottom-0`}>
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-center gap-3">
                    <div className="relative flex-1 group">
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-md`}></div>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask Atlas anything..."
                            className={`relative w-full py-4 pl-6 pr-12 ${isDark ? 'bg-midnight-800 text-white placeholder:text-gray-500' : 'bg-white text-gray-900 placeholder:text-gray-400'} border ${isDark ? 'border-white/10 focus:border-brand-primary/50' : 'border-warm-200 focus:border-brand-primary/30'} rounded-2xl outline-none transition-all shadow-sm focus:shadow-md text-base font-medium`}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-primary hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-brand-primary text-white rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
                <div className="text-center mt-3">
                    <p className="text-[10px] text-theme-muted uppercase tracking-widest opacity-50">
                        Made by Prraneet Priyaansh, founder of quantix, for students❤️
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DoubtSolver;
