import React, { useState, useEffect, useRef } from 'react';
import { Send, FilePlus, Sparkles, BookOpen, Brain, CreditCard, Map, MessageSquare, Loader2, Bot, User, Upload, Layers, Lightbulb, FileText, X, ChevronRight, Copy, Check, MapPin, RefreshCw, Crown } from './Icons';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import * as pdfjsLib from 'pdfjs-dist';
import { GROQ_API_URL, formatGroqPayload, useRetryableFetch } from '../utils/api';
import RagService from '../utils/ragService';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.449/build/pdf.worker.min.mjs';

const DocumentStudy = () => {
    const { isDark } = useTheme();
    const { retryableFetch } = useRetryableFetch();
    const { canUseFeature, incrementUsage, triggerUpgradeModal, isPro, getRemainingUses } = useSubscription();

    // State
    const [documentContent, setDocumentContent] = useState('');
    const [fileData, setFileData] = useState(null); // { mimeType, data (base64) } for vision
    const [fileName, setFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const [activeTab, setActiveTab] = useState('tools'); // 'tools' | 'chat'
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isContentCollapsed, setIsContentCollapsed] = useState(false);

    // Chat State
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    const fileInputRef = useRef(null);
    const chatEndRef = useRef(null);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

    // --- File Handling ---

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };

    const extractPdfTextPreview = async (arrayBuffer) => {
        try {
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            const pagesToRead = Math.min(pdf.numPages, 10); // Limit to 10 pages
            for (let i = 1; i <= pagesToRead; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += `--- Page ${i} ---\n${pageText}\n\n`;
            }
            if (pdf.numPages > 10) fullText += `\n... (Remaining ${pdf.numPages - 10} pages truncacted for performance)`;
            return fullText.trim();
        } catch (err) {
            console.error("PDF extraction error:", err);
            return `Error reading PDF: ${err.message}`;
        }
    };

    const processFile = async (file) => {
        if (!file) return;

        setIsPdfLoading(true);
        try {
            let content = '';
            let mimeType = file.type;
            let base64 = null;

            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                content = await extractPdfTextPreview(arrayBuffer) || '';
                if (!content) content = "[PDF Content Extracted]";
            } else if (file.type.startsWith('image/')) {
                base64 = await fileToBase64(file);
                content = `[Image Loaded: ${file.name}]`;
            } else {
                content = await file.text();
            }

            setFileName(file.name);
            setDocumentContent(content);
            setFileData(base64 ? { mimeType, data: base64 } : null);
            setChatMessages([]);
            setResult('');
        } catch (error) {
            console.error('File processing error:', error);
            alert('Failed to process file');
        } finally {
            setIsPdfLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // --- AI Logic ---

    const callGroq = async (prompt, systemPrompt) => {
        try {
            let payload;

            // Vision Request (Llama 3.2 11B Vision)
            if (fileData) {
                payload = {
                    model: "llama-3.2-11b-vision-preview",
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: taskPrompt(prompt, systemPrompt) },
                                { type: "image_url", image_url: { url: `data:${fileData.mimeType};base64,${fileData.data}` } }
                            ]
                        }
                    ],
                    temperature: 0.5,
                    max_tokens: 1024
                };
            }
            // Text Request (Llama 3.1 8B)
            else {
                payload = {
                    model: "llama-3.1-8b-instant",
                    ...formatGroqPayload(prompt, systemPrompt)
                };
            }

            const result = await retryableFetch(GROQ_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return { content: result.choices?.[0]?.message?.content };
        } catch (e) {
            console.error(`[DocumentStudy] Groq Error:`, e);
            return { error: e.message };
        }
    };

    const taskPrompt = (userRequest, sysContext) => {
        // Helper to combine system context and user request for vision models which might behave better with single user message
        return `${sysContext}\n\nUSER REQUEST: ${userRequest}`;
    };

    // --- Tools ---

    const handleToolAction = async (action) => {
        if (!documentContent && !fileData) return alert("Please upload a file first.");

        // Document Study tools are UNLIMITED (no usage limits here)

        setIsLoading(true);
        setResult('');

        const prompts = {
            summarize: "Summarize this document concisely with high-level bullet points and key takeaways. Use ✨ emojis for key points. Format beautifully with markdown headers and lists.",
            explain: "Explain the main concepts of this document in simple terms, as if teaching a beginner. Use 💡 for insights, 📖 for definitions, and ✅ for key takeaways. Format with clear sections.",
            test: "Generate a quiz (5 questions) based on this content. Use beautiful formatting with ❓ for questions and ✅ for answers. Format: ## Question 1 \n**Question text**\n\nA) Option 1\nB) Option 2\nC) Option 3\nD) Option 4\n\n**✅ Correct Answer:** A",
            flashcards: "Create 5 high-quality flashcards from this content. Use 📝 for terms and 💡 for definitions. Format beautifully: ## Flashcard 1\n**📝 Term:** [term]\n**💡 Definition:** [definition]"
        };

        const basePrompt = prompts[action];
        let systemPrompt = "You are AUREM, an expert educational AI assistant. Always format your responses beautifully with markdown, emojis, and clear structure.";

        // RAG / Context Building
        if (documentContent && !fileData) {
            const truncatedContent = documentContent.slice(0, 15000);
            systemPrompt += `\n\nDOCUMENT CONTENT:\n${truncatedContent}\n\nAnalyze the document above.`;
        } else if (fileData) {
            systemPrompt += "\n\nAnalyze the provided image.";
        }

        const response = await callGroq(basePrompt, systemPrompt);

        if (response.error) setResult("Error: " + response.error);
        else {
            setResult(response.content);
        }

        setIsLoading(false);
    };

    // --- Chat ---

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        const msg = chatInput.trim();
        if (!msg) return;

        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
        setIsChatLoading(true);

        let systemPrompt = "You are AUREM. Answer the question based on the document. Be helpful and format responses nicely.";
        if (documentContent && !fileData) {
            const truncatedContent = documentContent.slice(0, 15000);
            systemPrompt += `\n\nCONTEXT:\n${truncatedContent}`;
        }

        const response = await callGroq(msg, systemPrompt);

        const reply = response.error ? "Error: " + response.error : response.content;
        setChatMessages(prev => [...prev, { role: 'model', text: reply }]);
        setIsChatLoading(false);
    };

    // --- UI Helpers ---

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`h-full ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} font-sans transition-colors duration-300 overflow-y-auto custom-scrollbar`}>

            {/* Header - Animate Enter */}
            <div className="py-6 text-center animate-enter">
                <div className="flex items-center justify-center gap-3 mb-1">
                    <Layers className="w-8 h-8 text-orange-500" />
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-500">Document Study</h1>
                </div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">Upload Documents for AI-Powered Analysis & Chat</p>
            </div>

            <div className="max-w-5xl mx-auto w-full px-6 pb-12 flex flex-col">

                {/* Upload Area - Delayed Enter */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => {
                        e.preventDefault();
                        setIsDragging(false);
                        processFile(e.dataTransfer.files?.[0]);
                    }}
                    className={`relative shrink-0 mb-4 border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 group animate-enter opacity-0 delay-100 fill-mode-forwards
                        ${isDragging ? 'border-orange-500 bg-orange-500/10' : isDark ? 'border-gray-800 bg-gray-900/50 hover:border-gray-700' : 'border-gray-300 bg-white hover:border-orange-400'}
                    `}
                    style={{ animationFillMode: 'forwards' }}
                >
                    <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,image/*" onChange={e => processFile(e.target.files?.[0])} className="hidden" />

                    {fileName ? (
                        <div className="animate-in fade-in zoom-in duration-300">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-orange-500" />
                            <h3 className="text-xl font-bold">{fileName}</h3>
                            <p className="text-xs text-gray-500 mt-2 font-medium tracking-wide">Click to change file</p>
                        </div>
                    ) : (
                        <div className="group-hover:scale-105 transition-transform duration-300">
                            <Upload className={`w-12 h-12 mx-auto mb-3 ${isPdfLoading ? 'text-orange-500 animate-bounce' : 'text-gray-600'}`} />
                            <h3 className="text-lg font-bold text-gray-400">{isPdfLoading ? 'Processing...' : 'Click or Drag File'}</h3>
                        </div>
                    )}
                </div>

                {/* Extracted Content View */}
                {documentContent && (
                    <div className={`shrink-0 mb-6 rounded-2xl border overflow-hidden transition-all duration-300 animate-enter ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <div
                            onClick={() => setIsContentCollapsed(!isContentCollapsed)}
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5"
                        >
                            <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                <FilePlus className="w-4 h-4" /> View/Edit Extracted Content
                            </h4>
                            <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${isContentCollapsed ? '' : 'rotate-90'}`} />
                        </div>

                        {!isContentCollapsed && (
                            <div className="px-4 pb-4">
                                <textarea
                                    value={documentContent}
                                    onChange={e => setDocumentContent(e.target.value)}
                                    className={`w-full h-32 p-3 text-xs font-mono rounded-xl resize-y focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors
                                        ${isDark ? 'bg-black/30 text-gray-400' : 'bg-gray-50 text-gray-700'}`}
                                />
                                <div className="flex justify-end mt-2">
                                    <span className="text-[10px] text-gray-600">{documentContent.length} characters loaded</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-4 mb-6 shrink-0 sticky top-0 z-20 pt-2 backdrop-blur-md animate-enter opacity-0 delay-200" style={{ animationFillMode: 'forwards' }}>
                    <button
                        onClick={() => setActiveTab('tools')}
                        className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm
                            ${activeTab === 'tools'
                                ? 'bg-orange-500 text-white shadow-orange-500/20 scale-[1.02]'
                                : isDark ? 'bg-gray-900 text-gray-500 hover:bg-gray-800' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}
                        `}
                    >
                        <Sparkles className="w-4 h-4" /> Analysis Tools
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm
                            ${activeTab === 'chat'
                                ? 'bg-orange-500 text-white shadow-orange-500/20 scale-[1.02]'
                                : isDark ? 'bg-gray-900 text-gray-500 hover:bg-gray-800' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}
                        `}
                    >
                        <MessageSquare className="w-4 h-4" /> Ask Questions
                    </button>
                </div>

                {/* Main Content Area */}
                <div>

                    {/* Tools Tab */}
                    {activeTab === 'tools' && (
                        <div className="space-y-6">
                            {/* Action Grid - Staggered Animation */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { id: 'summarize', label: 'Summarize', icon: FileText },
                                    { id: 'explain', label: 'Explain', icon: Lightbulb },
                                    { id: 'test', label: 'Generate Test', icon: Check },
                                    { id: 'flashcards', label: 'Flashcards', icon: CreditCard }
                                ].map((tool, index) => (
                                    <button
                                        key={tool.id}
                                        onClick={() => handleToolAction(tool.id)}
                                        disabled={isLoading}
                                        style={{ animationDelay: `${index * 100 + 300}ms`, animationFillMode: 'forwards' }}
                                        className={`p-6 rounded-3xl border flex flex-col items-center justify-center gap-3 transition-all duration-300 group animate-enter opacity-0
                                            hover:scale-105 hover:shadow-xl hover:shadow-orange-500/20 active:scale-95
                                            ${isDark
                                                ? 'bg-gray-900 border-gray-800 hover:border-orange-500/50 hover:bg-gray-800'
                                                : 'bg-white border-gray-200 hover:border-orange-500 hover:shadow-lg'}
                                        `}
                                    >
                                        <div className={`p-4 rounded-full transition-colors duration-300 ${isDark ? 'bg-gray-800 group-hover:bg-orange-500/20' : 'bg-orange-50 group-hover:bg-orange-100'}`}>
                                            <tool.icon className={`w-6 h-6 transition-colors ${isDark ? 'text-gray-400 group-hover:text-orange-500' : 'text-orange-500'}`} />
                                        </div>
                                        <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>{tool.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Result Area */}
                            {isLoading && (
                                <div className="text-center py-12 animate-enter">
                                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
                                    <p className="text-xs font-bold text-orange-500 uppercase tracking-widest animate-pulse">Aurem is analyzing...</p>
                                </div>
                            )}

                            {result && !isLoading && (
                                <div className={`relative p-8 rounded-3xl border animate-enter ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-xl'}`}>
                                    <button onClick={copyToClipboard} className="absolute top-6 right-6 p-2 rounded-lg hover:bg-gray-500/10 transition-colors">
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                                    </button>
                                    <div className={`prose max-w-none prose-p:leading-relaxed text-sm md:text-base ${isDark ? 'prose-invert' : ''}`}>
                                        <React.Fragment>
                                            {/* Enhanced markdown-like formatting */}
                                            {result.split('\n').map((line, i) => {
                                                // Handle headers
                                                if (line.startsWith('## ')) {
                                                    return <h2 key={i} className={`text-lg font-bold mt-6 mb-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{line.replace('## ', '')}</h2>;
                                                }
                                                if (line.startsWith('### ')) {
                                                    return <h3 key={i} className={`text-md font-bold mt-4 mb-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{line.replace('### ', '')}</h3>;
                                                }
                                                if (line.startsWith('# ')) {
                                                    return <h1 key={i} className={`text-xl font-black mt-6 mb-3 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{line.replace('# ', '')}</h1>;
                                                }
                                                // Handle bold text with **
                                                if (line.includes('**')) {
                                                    const parts = line.split(/\*\*(.+?)\*\*/g);
                                                    return (
                                                        <p key={i} className={`my-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {parts.map((part, j) =>
                                                                j % 2 === 1 ? <strong key={j} className="font-bold">{part}</strong> : part
                                                            )}
                                                        </p>
                                                    );
                                                }
                                                // Handle bullet points
                                                if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                                                    return (
                                                        <div key={i} className={`flex gap-2 my-1 ml-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            <span className="text-orange-500">•</span>
                                                            <span>{line.trim().replace(/^[-•]\s*/, '')}</span>
                                                        </div>
                                                    );
                                                }
                                                // Regular paragraph
                                                if (line.trim()) {
                                                    return <p key={i} className={`my-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{line}</p>;
                                                }
                                                return <div key={i} className="h-2" />;
                                            })}
                                        </React.Fragment>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Chat Tab */}
                    {activeTab === 'chat' && (
                        <div className={`flex flex-col h-[600px] rounded-3xl border overflow-hidden animate-enter opacity-0 delay-300 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`} style={{ animationFillMode: 'forwards' }}>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {chatMessages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                        <Bot className="w-12 h-12 mb-3" />
                                        <p className="text-sm font-medium">Start asking questions about your file</p>
                                    </div>
                                )}
                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-message`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-orange-500 text-white rounded-br-none'
                                            : isDark ? 'bg-gray-800 text-gray-200 rounded-tl-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isChatLoading && (
                                    <div className="flex justify-start animate-message">
                                        <div className={`p-4 rounded-2xl rounded-tl-none flex items-center gap-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                            <span className="text-xs font-bold text-gray-500">Thinking...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={handleChatSubmit} className={`p-4 border-t ${isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-100 bg-gray-50'}`}>
                                <div className="relative">
                                    <input
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        placeholder="Ask a question..."
                                        className={`w-full pl-6 pr-14 py-4 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all
                                            ${isDark ? 'bg-gray-900 text-white placeholder-gray-600' : 'bg-white text-gray-900 placeholder-gray-400 shadow-sm'}
                                        `}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isChatLoading || !chatInput.trim()}
                                        className="absolute right-2 top-2 bottom-2 aspect-square bg-orange-500 rounded-xl flex items-center justify-center text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default DocumentStudy;
