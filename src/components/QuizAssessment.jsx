import React, { useState, useEffect, useRef } from 'react';
import { FileText, Loader2, BookOpen, ChevronRight, Brain, Trophy, AlertCircle, RefreshCw, Sparkles, Youtube, Crown, Upload } from './Icons';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { GROQ_API_URL, formatGroqPayload } from '../utils/api';
import CloudService from '../utils/cloudService';
import RagService from '../utils/ragService';
import { MOCK_SYLLABUS } from '../data/mockData';
import * as pdfjsLib from 'pdfjs-dist';

const QuizAssessment = ({ retryableFetch }) => {
    const { isDark } = useTheme();
    const { canUseFeature, incrementUsage, triggerUpgradeModal, isPro, getRemainingUses } = useSubscription();
    const [step, setStep] = useState('setup'); // setup, taking, grading, result
    const [mode, setMode] = useState('standard'); // 'standard' or 'similar-paper'
    const [config, setConfig] = useState({
        curriculum: 'CBSE', // CBSE or ICSE
        subject: '', // The broader subject (e.g., Physics)
        topic: '', // The specific chapter/topic (e.g., Electricity)
        difficulty: 'Medium',
        count: 5,
        type: 'Both',
        docId: 'internal' // 'internal' for AI data, or a doc ID for RAG
    });
    const [documents, setDocuments] = useState([]);
    const [quizData, setQuizData] = useState(null);
    const [answers, setAnswers] = useState({});
    const [gradingResult, setGradingResult] = useState(null); // Now a Markdown string or JSON
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [assessmentStats, setAssessmentStats] = useState(null);

    // Similar Paper state
    const [samplePaper, setSamplePaper] = useState(null);
    const [samplePaperText, setSamplePaperText] = useState('');
    const [similarPattern, setSimilarPattern] = useState('Mixed'); // Objective, Subjective, Mixed
    const fileInputRef = useRef(null);

    useEffect(() => {
        const cloudDocs = CloudService.getAllDocuments();
        const virtualDocs = [
            { id: 'internal', name: 'Official Board Curriculum (AI)', content: 'AI_INTERNAL' },
            ...cloudDocs
        ];
        setDocuments(virtualDocs);
    }, []);

    const handleConfigChange = (e) => setConfig({ ...config, [e.target.name]: e.target.value });

    // Generate Quiz using RAG + Ollama
    const generateQuiz = async (e) => {
        e.preventDefault();

        // Check usage limits (Basic: 2/day)
        if (!canUseFeature('quiz')) {
            triggerUpgradeModal('quiz');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let retrievedContext = "";
            let systemInstruction = `You are a specialized Exam Paper Setter for ${config.curriculum} Board. Use your internal training data.`;

            if (config.docId !== 'internal') {
                const selectedDoc = documents.find(d => d.id === config.docId);
                if (selectedDoc) {
                    retrievedContext = await RagService.retrieveContext(config.subject || selectedDoc.name, selectedDoc);
                    systemInstruction = "You are a specialized Exam Paper Setter. Generate the quiz based ONLY on the provided document context.";
                }
            }

            // 2. Build Prompt
            const prompt = `
                Generate a ${config.difficulty} difficulty ${config.curriculum} board assessment.
                Subject: ${config.subject}
                Chapter/Topic: ${config.topic}
                Total Questions: ${config.count}
                Question Style: ${config.type}
                
                ${retrievedContext ? `DOCUMENT CONTEXT:\n${retrievedContext}` : "Use your internal knowledge of the latest official NCERT/ICSE curriculum."}
                
                Respond ONLY with a valid JSON object matching this schema:
                {
                  "quiz_metadata": {"subject": "${config.subject}", "topic": "${config.topic}", "difficulty": "${config.difficulty}", "board": "${config.curriculum}"},
                  "questions": [
                    {
                      "id": number,
                      "type": "objective",
                      "question": "string",
                      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                      "correct_answer": "One of the options exactly",
                      "explanation": "Brief explanation"
                    }
                  ]
                }
            `;

            // 3. Call Groq
            const payload = formatGroqPayload(prompt, systemInstruction);
            const result = await retryableFetch(GROQ_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const text = result.choices?.[0]?.message?.content || "";

            try {
                const parsedQuiz = RagService.extractJson(text);
                setQuizData(parsedQuiz);
                setStep('taking');
                // Track usage after successful quiz generation
                incrementUsage('quiz');
            } catch (e) {
                console.error("Quiz Parse Error:", e, "Raw Text:", text);
                throw new Error("AI returned an invalid quiz format. Please try again.");
            }
        } catch (err) {
            setError(err.message || "Failed to generate RAG quiz.");
        } finally { setIsLoading(false); }
    };

    // Handle file upload for similar paper
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSamplePaper(file);
        setIsLoading(true);
        setError(null);

        try {
            let extractedText = '';

            if (file.type === 'application/pdf') {
                // Extract text from PDF
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

                for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    extractedText += pageText + '\n\n';
                }
            } else if (file.type.startsWith('image/')) {
                // For images, we'll use a placeholder message
                extractedText = '[Image file uploaded - OCR not yet implemented]';
            }

            setSamplePaperText(extractedText);
        } catch (err) {
            setError('Failed to extract text from file: ' + err.message);
            setSamplePaper(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Generate similar paper from sample
    const generateSimilarPaper = async (e) => {
        e.preventDefault();

        if (!samplePaperText) {
            setError('Please upload a sample paper first');
            return;
        }


        // Check usage limits (Basic: 2/day)
        if (!canUseFeature('quiz')) {
            triggerUpgradeModal('quiz');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const patternInstruction = similarPattern === 'Objective'
                ? 'Generate ONLY objective/MCQ questions with 4 options each.'
                : similarPattern === 'Subjective'
                    ? 'Generate ONLY subjective/theory questions requiring detailed answers.'
                    : 'Generate a MIX of objective (MCQ) and subjective questions.';

            const prompt = `
                Analyze this sample test paper and generate a NEW test with SIMILAR but NOT IDENTICAL questions.
                
                SAMPLE PAPER TEXT:
                ${samplePaperText.substring(0, 8000)} 
                
                QUESTION PATTERN REQUIRED: ${similarPattern}
                ${patternInstruction}
                
                Your task:
                1. Identify the difficulty level (Easy/Medium/Hard)
                2. Identify topics and question types
                3. Generate ${config.count} NEW questions that:
                   - Match the same difficulty level
                   - Cover similar topics
                   - Follow the specified pattern: ${similarPattern}
                   - Are NOT copies of the original questions
                
                Respond ONLY with a valid JSON object matching this schema:
                {
                  "quiz_metadata": {
                    "subject": "detected subject",
                    "topic": "detected topics",
                    "difficulty": "detected difficulty",
                    "board": "${config.curriculum}"
                  },
                  "questions": [
                    {
                      "id": number,
                      "type": "objective",
                      "question": "string",
                      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                      "correct_answer": "One of the options exactly",
                      "explanation": "Brief explanation"
                    }
                  ]
                }
            `;

            const payload = formatGroqPayload(prompt, "You are an expert exam paper generator. Analyze sample papers and create similar questions.");
            const result = await retryableFetch(GROQ_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const text = result.choices?.[0]?.message?.content;
            if (!text) throw new Error("No response from AI");

            try {
                const parsedQuiz = RagService.extractJson(text);
                setQuizData(parsedQuiz);
                setStep('taking');
                incrementUsage('quiz');
            } catch (e) {
                console.error("Quiz Parse Error:", e, "Raw Text:", text);
                throw new Error("AI returned an invalid quiz format. Please try again.");
            }
        } catch (err) {
            setError(err.message || "Failed to generate similar paper.");
        } finally { setIsLoading(false); }
    };

    // Submit Quiz for Grading (AI Learning Mentor)
    const submitQuiz = async () => {
        setIsLoading(true);
        setStep('grading');

        try {
            const selectedDoc = documents.find(d => d.id === config.docId);

            // Analyze performance for the prompt
            const wrongAnswers = [];
            const missedTopics = [];
            let correctCount = 0;

            quizData.questions.forEach(q => {
                const studentAnswer = answers[q.id];
                if (q.type === 'objective') {
                    if (studentAnswer === q.correct_answer) {
                        correctCount++;
                    } else {
                        wrongAnswers.push({
                            question: q.question,
                            student_answer: studentAnswer,
                            correct_answer: q.correct_answer
                        });
                        missedTopics.push(q.explanation || "Related Concept");
                    }
                } else {
                    wrongAnswers.push({ question: q.question, student_answer: studentAnswer, type: 'subjective' });
                }
            });

            const scorePercentage = Math.round((correctCount / quizData.questions.length) * 100);

            setAssessmentStats({
                score: scorePercentage,
                correct: correctCount,
                total: quizData.questions.length,
                wrongAnswers
            });

            const prompt = `
                Perform an elite level pedagogical assessment for a ${config.curriculum} student.
                Subject: ${config.subject}
                Specific Topic: ${config.topic}
                Student Score: ${scorePercentage}%
                Questions: ${quizData.questions.length}
                
                Incorrect/Subjective Data:
                ${JSON.stringify(wrongAnswers.map(w => ({ q: w.question, student_val: w.student_answer, correct_val: w.correct_answer, type: w.type })))}
                
                Instructions:
                1. Critically analyze the PATTERN of mistakes (Conceptual vs Factual vs Application).
                2. For Subjective answers, provide a brief grade (Correct/Partial/Incorrect).
                3. Evaluate the student's overall mastery level.
                4. Identify 2-3 specific "Target Topics" the student should re-study.
                5. Provide a "YouTube Search Link" for each target topic (Format: [Text](https://www.youtube.com/results?search_query=...)).
                6. Create a "Personalized Remedial Action Plan" (Markdown).
                7. Provide a "Mentor's Final Verdict".
            `;

            const payload = formatGroqPayload(prompt, "You are an AI Learning Mentor. Provide a detailed remedial plan in Markdown.");
            const result = await retryableFetch(GROQ_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const mentorResponse = result.choices?.[0]?.message?.content || "Could not analyze performance.";
            setGradingResult(mentorResponse);
            setStep('result');
        } catch (err) {
            setError("Analysis failed: " + err.message);
            setStep('setup');
        } finally { setIsLoading(false); }
    };

    return (
        <div className={`flex flex-col h-full ${isDark ? 'bg-gray-900' : 'bg-warm-100'} text-theme-primary relative overflow-y-auto custom-scrollbar p-4 md:p-8 transition-colors duration-300 section-quiz`}>
            {/* Decorative gradient - Purple/Rose themed */}
            <div className={`absolute top-0 right-0 w-[600px] h-[600px] ${isDark ? 'bg-purple-900/10' : 'bg-purple-400/10'} rounded-full blur-[100px] -z-10 pointer-events-none`} />
            <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] ${isDark ? 'bg-rose-900/10' : 'bg-rose-400/10'} rounded-full blur-[100px] -z-10 pointer-events-none`} />

            {step === 'setup' && (
                <div className="max-w-4xl mx-auto w-full animate-slide-up">
                    <div className="glass-panel p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-500 to-rose-500" />

                        <div className="flex items-center gap-4 mb-8">
                            <div className={`p-3 ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'} rounded-2xl`}>
                                <FileText className="w-8 h-8 text-purple-500" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-theme-primary">Quiz & Assessment</h2>
                                <p className="text-theme-muted text-sm">Generate quizzes or create similar test papers {!isPro && `(${getRemainingUses('quiz')} left today)`}</p>
                            </div>
                        </div>

                        {/* Mode Selector */}
                        <div className="mb-8 space-y-3">
                            <label className="text-sm font-bold text-theme-muted uppercase tracking-wider block">Select Mode</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setMode('standard')}
                                    className={`p-4 rounded-xl border-2 transition-all ${mode === 'standard'
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : `border-transparent ${isDark ? 'bg-white/5' : 'bg-warm-200'}`
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="w-6 h-6 text-purple-500" />
                                        <div className="text-left">
                                            <div className="font-bold text-theme-primary">Standard Quiz</div>
                                            <div className="text-xs text-theme-muted">Topic-based assessment</div>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isPro) {
                                            triggerUpgradeModal('similar-paper');
                                            return;
                                        }
                                        setMode('similar-paper');
                                    }}
                                    className={`p-4 rounded-xl border-2 transition-all relative ${mode === 'similar-paper'
                                        ? 'border-amber-500 bg-amber-500/10'
                                        : `border-transparent ${isDark ? 'bg-white/5' : 'bg-warm-200'}`
                                        } ${!isPro && 'opacity-75'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Upload className="w-6 h-6 text-amber-500" />
                                        <div className="text-left flex-1">
                                            <div className="font-bold text-theme-primary flex items-center gap-2">
                                                Similar Paper
                                                <Crown className="w-4 h-4 text-amber-500" />
                                            </div>
                                            <div className="text-xs text-theme-muted">Upload & generate similar</div>
                                        </div>
                                        {!isPro && (
                                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded">
                                                PRO
                                            </div>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Similar Paper Upload UI */}
                        {mode === 'similar-paper' ? (
                            <form onSubmit={generateSimilarPaper} className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-theme-muted uppercase tracking-wider block">
                                        Upload Sample Paper
                                    </label>

                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${samplePaper
                                            ? 'border-amber-500 bg-amber-500/10'
                                            : `border-gray-400 ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-warm-200 hover:bg-warm-300'}`
                                            }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,image/*"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />

                                        <div className="flex flex-col items-center gap-4">
                                            {samplePaper ? (
                                                <>
                                                    <FileText className="w-12 h-12 text-amber-500" />
                                                    <div className="text-center">
                                                        <p className="font-bold text-theme-primary">{samplePaper.name}</p>
                                                        <p className="text-xs text-theme-muted">
                                                            {(samplePaper.size / 1024).toFixed(1)} KB • Click to change
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-12 h-12 text-gray-400" />
                                                    <div className="text-center">
                                                        <p className="font-bold text-theme-primary">Drop your sample paper here</p>
                                                        <p className="text-xs text-theme-muted">Or click to browse • PDF or Image</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {samplePaperText && (
                                        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-warm-200'} max-h-40 overflow-y-auto`}>
                                            <p className="text-xs text-theme-muted font-mono">{samplePaperText.substring(0, 500)}...</p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-theme-muted uppercase tracking-wider block">
                                            Number of Questions
                                        </label>
                                        <select
                                            name="count"
                                            value={config.count}
                                            onChange={handleConfigChange}
                                            className={`w-full p-4 rounded-xl glass-input focus:outline-none appearance-none cursor-pointer ${isDark ? 'bg-gray-800' : 'bg-warm-200'}`}
                                        >
                                            {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} Questions</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-theme-muted uppercase tracking-wider block">
                                            Question Pattern
                                        </label>
                                        <div className="flex gap-2">
                                            {['Objective', 'Subjective', 'Mixed'].map(p => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setSimilarPattern(p)}
                                                    className={`flex-1 p-3.5 rounded-xl border transition-all text-xs font-bold ${similarPattern === p
                                                        ? 'bg-amber-600 border-amber-400 text-white'
                                                        : `border-transparent ${isDark ? 'bg-white/5' : 'bg-warm-200'} text-theme-muted`
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                                        <AlertCircle className="w-5 h-5 text-rose-500" />
                                        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading || !samplePaper}
                                    className="w-full p-4 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Analyzing & Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Generate Similar Paper
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            // Standard Quiz Form
                            <form onSubmit={generateQuiz} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-theme-muted uppercase tracking-wider block">1. Curriculum Board</label>
                                        <div className="flex gap-2">
                                            {['CBSE', 'ICSE'].map(b => (
                                                <button key={b} type="button" onClick={() => setConfig({ ...config, curriculum: b })} className={`flex-1 p-3.5 rounded-xl border transition-all text-xs font-bold ${config.curriculum === b ? 'bg-purple-600 border-purple-400 text-white' : `border-transparent ${isDark ? 'bg-white/5' : 'bg-warm-200'} text-theme-muted`}`}>{b}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-theme-muted uppercase tracking-wider block">2. Difficulty</label>
                                        <div className="flex gap-2">
                                            {['Easy', 'Medium', 'Hard'].map(d => (
                                                <button key={d} type="button" onClick={() => setConfig({ ...config, difficulty: d })} className={`flex-1 p-3.5 rounded-xl border transition-all text-xs font-bold ${config.difficulty === d ? 'bg-purple-600 border-purple-400 text-white' : `border-transparent ${isDark ? 'bg-white/5' : 'bg-warm-200'} text-theme-muted`}`}>{d}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-theme-muted uppercase tracking-wider block">3. Subject</label>
                                        <input name="subject" value={config.subject} onChange={handleConfigChange} required placeholder="e.g. Physics, Chemistry, Biology..." className="w-full p-4 rounded-xl glass-input focus:outline-none" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-theme-muted uppercase tracking-wider block">4. Chapter or Topic</label>
                                        <input name="topic" value={config.topic} onChange={handleConfigChange} required placeholder="e.g. Life Processes, Light, Carbon..." className="w-full p-4 rounded-xl glass-input focus:outline-none" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-theme-muted uppercase tracking-wider block">5. Assessment Length</label>
                                        <select name="count" value={config.count} onChange={handleConfigChange} className={`w-full p-4 rounded-xl glass-input focus:outline-none appearance-none cursor-pointer ${isDark ? 'bg-gray-800' : 'bg-warm-200'}`}>
                                            {[5, 10, 15, 20].map(n => <option key={n} value={n} className={isDark ? 'bg-gray-800' : 'bg-warm-100'}>{n} Questions</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-theme-muted uppercase tracking-wider block">6. Question Style</label>
                                        <select name="type" value={config.type} onChange={handleConfigChange} className={`w-full p-4 rounded-xl glass-input focus:outline-none appearance-none cursor-pointer ${isDark ? 'bg-gray-800' : 'bg-warm-200'}`}>
                                            <option value="Objective" className={isDark ? 'bg-gray-800' : 'bg-warm-100'}>MCQs Only</option>
                                            <option value="Subjective" className={isDark ? 'bg-gray-800' : 'bg-warm-100'}>Short/Long Answers</option>
                                            <option value="Both" className={isDark ? 'bg-gray-800' : 'bg-warm-100'}>Mixed Pattern</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-2xl ${isDark ? 'bg-purple-500/5 border-purple-500/10' : 'bg-purple-100 border-purple-200'} border flex items-center justify-between`}>
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="w-5 h-5 text-purple-500" />
                                        <span className="text-xs font-medium text-theme-muted">Context Source:</span>
                                    </div>
                                    <select name="docId" value={config.docId} onChange={handleConfigChange} className="bg-transparent text-purple-500 text-xs font-bold focus:outline-none cursor-pointer">
                                        {documents.map(doc => <option key={doc.id} value={doc.id} className={isDark ? 'bg-gray-800' : 'bg-warm-100'}>{doc.name}</option>)}
                                    </select>
                                </div>

                                <button type="submit" disabled={isLoading} className="w-full py-4 bg-gradient-to-r from-purple-600 to-rose-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-[1.01] flex justify-center items-center">
                                    {isLoading ? <><Loader2 className="animate-spin mr-2" /> Preparing Exam Paper...</> : 'Generate Assessment'}
                                </button>
                                {error && <div className={`text-rose-500 text-sm text-center font-medium ${isDark ? 'bg-rose-400/10 border-rose-400/20' : 'bg-rose-100 border-rose-200'} p-3 rounded-lg border`}>{error}</div>}
                            </form>
                        )}
                    </div>
                </div>
            )}

            {step === 'taking' && quizData && (
                <div className="max-w-4xl mx-auto w-full animate-slide-up space-y-8 pb-20">
                    <div className="glass-panel-lighter p-6 rounded-2xl flex justify-between items-center sticky top-0 z-30 backdrop-blur-xl shadow-xl">
                        <div>
                            <h3 className="text-xl font-bold text-theme-primary">Assessment Board</h3>
                            <span className="text-purple-500 text-xs font-bold uppercase tracking-widest">{config.difficulty} Level Pattern</span>
                        </div>
                        <button onClick={submitQuiz} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl font-bold shadow-lg hover:shadow-green-500/20 transition-all border border-emerald-400/30 text-white">
                            Submit for Review
                        </button>
                    </div>

                    <div className="space-y-6">
                        {quizData.questions.map((q, i) => (
                            <div key={q.id} className="glass-panel p-8 rounded-3xl shadow-lg group hover:border-purple-500/30 transition-all" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-color)' }}>
                                <div className="flex gap-6">
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-100 border-purple-200'} text-purple-500 flex items-center justify-center font-bold border`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xl font-medium text-theme-secondary mb-6 leading-relaxed">{q.question}</p>

                                        {q.type === 'objective' ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {q.options.map((opt, idx) => (
                                                    <label key={idx} className={`flex items-center p-5 rounded-2xl border transition-all cursor-pointer ${answers[q.id] === opt ? `${isDark ? 'bg-purple-600/20 border-purple-500' : 'bg-purple-100 border-purple-400'} shadow-inner` : `${isDark ? 'border-white/5 bg-white/5 hover:bg-white/10' : 'border-warm-300 bg-warm-200/50 hover:bg-warm-300'}`}`}>
                                                        <input type="radio" name={`q-${q.id}`} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswers({ ...answers, [q.id]: opt })} className="hidden" />
                                                        <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-all ${answers[q.id] === opt ? 'border-purple-500 bg-purple-500' : `${isDark ? 'border-slate-600' : 'border-warm-400'}`}`}>
                                                            {answers[q.id] === opt && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                                                        </div>
                                                        <span className="text-theme-secondary font-medium">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <textarea
                                                rows="4"
                                                className="w-full glass-input p-6 rounded-2xl focus:outline-none text-lg"
                                                placeholder="Write your comprehensive response..."
                                                value={answers[q.id] || ''}
                                                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(step === 'grading' || step === 'result') && (
                <div className="max-w-4xl mx-auto w-full animate-slide-up space-y-6 pb-20">
                    {isLoading && (
                        <div className="glass-panel p-20 rounded-3xl text-center shadow-2xl">
                            <div className="relative inline-block mb-8">
                                <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 animate-pulse" />
                                <Brain className="w-16 h-16 text-purple-500 mx-auto relative animate-float" />
                            </div>
                            <h3 className="text-2xl font-bold text-theme-primary mb-2">AI Mentor Analysis</h3>
                            <p className="text-theme-muted max-w-sm mx-auto">Evaluating conceptual clarity, grading subjective nuances, and preparing your remedial plan.</p>
                        </div>
                    )}

                    {!isLoading && gradingResult && (
                        <div className="space-y-8 pb-10">
                            {/* Dashboard Header */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className={`lg:col-span-2 glass-panel p-8 rounded-[40px] flex items-center justify-between relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-purple-900/40 to-black/40' : 'bg-gradient-to-br from-purple-100 to-rose-50'}`}>
                                    <div className="relative z-10">
                                        <h3 className="text-sm font-bold text-purple-500 uppercase tracking-[0.2em] mb-1">Board Scorecard</h3>
                                        <h2 className="text-5xl font-black text-theme-primary mb-4 italic">EXCELLENCE</h2>
                                        <div className="flex gap-3">
                                            <span className={`px-4 py-1.5 rounded-full ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-warm-200'} border text-[10px] font-bold text-theme-secondary uppercase tracking-widest`}>{config.curriculum} PATTERN</span>
                                            <span className={`px-4 py-1.5 rounded-full ${isDark ? 'bg-purple-500/20 border-purple-500/30' : 'bg-purple-100 border-purple-200'} border text-[10px] font-bold text-purple-500 uppercase tracking-widest`}>{config.subject}</span>
                                        </div>
                                    </div>

                                    <div className="relative w-32 h-32 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className={isDark ? 'text-white/5' : 'text-warm-200'} />
                                            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={351.8} strokeDashoffset={351.8 - (351.8 * assessmentStats?.score) / 100} className="text-purple-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                                        </svg>
                                        <div className="absolute text-3xl font-black text-theme-primary">{assessmentStats?.score}<span className="text-sm">%</span></div>
                                    </div>
                                </div>

                                <div className={`glass-panel p-8 rounded-[40px] ${isDark ? 'bg-gradient-to-b from-purple-900/30 to-black/40' : 'bg-gradient-to-b from-purple-50 to-rose-50'} flex flex-col justify-center items-center text-center`}>
                                    <Trophy className={`w-12 h-12 mb-4 ${assessmentStats?.score > 80 ? 'text-amber-400' : 'text-theme-muted opacity-50'}`} />
                                    <h4 className="text-xs font-bold text-theme-muted uppercase tracking-[0.2em] mb-1">Rank Status</h4>
                                    <div className="text-2xl font-bold text-theme-primary uppercase italic">
                                        {assessmentStats?.score > 90 ? 'Merit' : assessmentStats?.score > 70 ? 'Qualified' : 'Requires Aim'}
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total', val: assessmentStats?.total, color: 'text-sky-500' },
                                    { label: 'Correct', val: assessmentStats?.correct, color: 'text-emerald-500' },
                                    { label: 'Accuracy', val: assessmentStats?.score + '%', color: 'text-purple-500' },
                                    { label: 'Mistakes', val: assessmentStats?.wrongAnswers.length, color: 'text-rose-500' }
                                ].map((stat, i) => (
                                    <div key={i} className={`glass-panel p-5 rounded-3xl ${isDark ? 'bg-white/5' : 'bg-warm-200/50'} text-center`}>
                                        <div className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-1">{stat.label}</div>
                                        <div className={`text-2xl font-black ${stat.color}`}>{stat.val}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Knowledge Resources Section */}
                            <div className={`glass-panel p-8 rounded-[40px] ${isDark ? 'bg-purple-500/5' : 'bg-purple-50'}`}>
                                <div className="flex items-center gap-3 mb-6">
                                    <Sparkles className="w-6 h-6 text-purple-500" />
                                    <h3 className="text-xl font-bold text-theme-primary">Recommended Learning</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-theme-muted uppercase tracking-widest pl-1">Weak Concepts to Master</h4>
                                        <div className="space-y-2">
                                            {assessmentStats?.wrongAnswers.slice(0, 3).map((w, i) => (
                                                <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-warm-200/50'} text-sm font-medium text-theme-secondary`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                                                    {w.question.split('?')[0].length > 40 ? w.question.substring(0, 40) + '...' : w.question}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-theme-muted uppercase tracking-widest pl-1">Study Material (YouTube)</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {[`CBSE ${config.subject} ${config.topic} class 10`, `NCERT ${config.topic} explained`, `${config.topic} revision`].map((q, i) => (
                                                <a
                                                    key={i}
                                                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 p-3.5 rounded-2xl ${isDark ? 'bg-red-600/10 border-red-600/20' : 'bg-red-50 border-red-200'} border text-red-500 hover:bg-red-600 hover:text-white transition-all text-xs font-black uppercase tracking-wider`}
                                                >
                                                    <Youtube className="w-4 h-4" />
                                                    Watch Tutorial
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AI Mentor Deep Report */}
                            <div className={`glass-panel p-8 rounded-[40px] relative overflow-hidden ${isDark ? 'bg-slate-900/80' : 'bg-warm-200/70'}`}>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className={`p-4 ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'} rounded-2xl text-purple-500`}>
                                        <Brain className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-rose-500">Pedagogical Analysis</h2>
                                        <p className="text-theme-muted text-sm font-bold uppercase tracking-widest">AI Learning Mentor v2.0</p>
                                    </div>
                                </div>

                                <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:text-purple-500 prose-li:text-theme-secondary">
                                    <div className={`whitespace-pre-wrap font-sans text-lg text-theme-secondary ${isDark ? 'bg-white/5' : 'bg-warm-100'} p-8 rounded-3xl`} style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-color)' }}>
                                        {gradingResult}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep('setup')} className="flex-1 py-5 bg-purple-600 text-white rounded-[30px] font-black text-xl hover:bg-purple-700 transition-all shadow-2xl shadow-purple-900/40 flex justify-center items-center gap-3">
                                    <RefreshCw className="w-6 h-6" /> NEW STUDY CYCLE
                                </button>
                                <button onClick={() => window.print()} className={`py-5 px-8 ${isDark ? 'bg-white/5 border-white/10' : 'bg-warm-200 border-warm-300'} border text-theme-primary rounded-[30px] font-bold hover:opacity-80 transition-all`}>
                                    SAVE REPORT
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuizAssessment;
