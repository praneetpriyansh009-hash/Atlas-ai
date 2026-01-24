import React from 'react';
import { Trophy, Target, TrendingUp, AlertCircle, BookOpen, CheckCircle, XCircle, RefreshCw, Youtube } from 'lucide-react';

const QuizResult = ({ data, videoRecs, onRetry }) => {
    if (!data) return null;

    const { score, percentage, grade, summary, weak_areas = [], improvement_tips = [], detailed_feedback = [] } = data;

    // Calculate color based on grade/percentage
    const getGradeColor = (g) => {
        if (!g) return 'text-gray-400';
        const gradeChar = g.charAt(0).toUpperCase();
        if (['A', 'Outstanding', 'Excellent'].includes(g) || (percentage >= 90)) return 'text-emerald-400';
        if (['B', 'Good'].includes(g) || (percentage >= 75)) return 'text-blue-400';
        if (['C', 'Average'].includes(g) || (percentage >= 60)) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="max-w-5xl mx-auto w-full space-y-8 animate-slide-up pb-10">

            {/* Header / Score Card */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${getGradeColor(grade).replace('text-', 'from-')}-500 to-purple-600`} />

                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left flex-1">
                        <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                            <Trophy className="w-8 h-8 text-yellow-500" />
                            Quiz Complete!
                        </h2>
                        <p className="text-slate-300 text-lg">{summary}</p>
                    </div>

                    <div className="flex items-center justify-center relative w-40 h-40 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent"
                                strokeDasharray={440}
                                strokeDashoffset={440 - (440 * (percentage || 0)) / 100}
                                className={`${getGradeColor(grade)} transition-all duration-1000 ease-out`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-4xl font-bold ${getGradeColor(grade)}`}>{percentage}%</span>
                            <span className="text-sm text-slate-400">{score} Correct</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Weak Areas */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-red-500/5">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                        Needs Focus
                    </h3>
                    <div className="space-y-3">
                        {weak_areas.length > 0 ? (
                            weak_areas.map((area, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                    <Target className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-slate-200">{area}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-400 italic">Great job! No specific weak areas detected.</p>
                        )}
                    </div>
                </div>

                {/* Improvement Tips */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-emerald-500/5">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                        Path to Mastery
                    </h3>
                    <div className="space-y-3">
                        {improvement_tips.length > 0 ? (
                            improvement_tips.map((tip, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                    <BookOpen className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-slate-200">{tip}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-400 italic">Keep practicing to maintain your streak!</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed Breakdown */}
            {detailed_feedback && detailed_feedback.length > 0 && (
                <div className="glass-panel p-6 rounded-2xl border border-white/5">
                    <h3 className="text-xl font-bold text-white mb-6">Detailed Analysis</h3>
                    <div className="space-y-4">
                        {detailed_feedback.map((item, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border ${item.status === 'correct' ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <span className="font-bold text-slate-300">Question {idx + 1}</span>
                                    {item.status === 'correct' ?
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400">Correct</span> :
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400">Incorrect</span>
                                    }
                                </div>
                                <p className="text-sm text-slate-300">{item.explanation}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Video Recommendations */}
            {videoRecs.length > 0 && (
                <div className="glass-panel p-8 rounded-3xl border border-white/10">
                    <h3 className="text-xl font-bold mb-6 flex items-center"><Youtube className="mr-3 text-red-500" /> Curated Video Lessons</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {videoRecs.map((v, i) => (
                            <a key={i} href={v.uri} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group">
                                <div className="font-bold text-slate-200 group-hover:text-purple-300 mb-2 truncate">{v.title}</div>
                                <div className="text-xs text-slate-500 truncate flex items-center gap-2">
                                    <Youtube className="w-3 h-3 text-red-500" />
                                    {v.uri}
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <button onClick={onRetry} className="w-full py-4 mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-[1.01] flex justify-center items-center gap-2">
                <RefreshCw className="w-5 h-5" /> Take Another Quiz
            </button>
        </div>
    );
};

export default QuizResult;
