import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Sparkles, Crown, Zap, Mic, GraduationCap, Brain, X, Check, Infinity, CreditCard, Loader2 } from './Icons';

const UpgradeModal = () => {
    const { isDark } = useTheme();
    const { showUpgradeModal, setShowUpgradeModal, upgradeFeature, upgradeToPro, tier } = useSubscription();
    const [showPayment, setShowPayment] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);


    if (!showUpgradeModal) return null;

    const featureNames = {
        'college-compass': 'College Compass',
        'podcast': 'Podcast Studio',
        'quiz': 'Quiz Generation',
        'mindmap': 'Mind Map Generation',
        'upgrade': 'Pro features',
        'similar-paper': 'Similar Test Paper Generator'
    };

    const featureName = featureNames[upgradeFeature] || 'this feature';
    const isDirectUpgrade = upgradeFeature === 'upgrade';

    const handleUpgradeClick = () => {
        setShowPayment(true);
    };

    const handlePayment = async () => {
        setIsProcessing(true);

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        setIsProcessing(false);
        setPaymentSuccess(true);

        // Activate Pro after "payment"
        setTimeout(() => {
            upgradeToPro();
            setShowPayment(false);
            setPaymentSuccess(false);
        }, 1500);
    };

    const handleClose = () => {
        setShowUpgradeModal(false);
        setShowPayment(false);
        setPaymentSuccess(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl animate-scale-in ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>

                {/* Header with gradient */}
                <div className="relative p-8 pb-12 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white text-center overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>

                    <div className="relative">
                        <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            {paymentSuccess ? (
                                <Check className="w-8 h-8 text-white" />
                            ) : showPayment ? (
                                <CreditCard className="w-8 h-8 text-white" />
                            ) : (
                                <Crown className="w-8 h-8 text-white" />
                            )}
                        </div>
                        <h2 className="text-2xl font-black mb-2">
                            {paymentSuccess ? 'Payment Successful!' : showPayment ? 'Complete Payment' : isDirectUpgrade ? 'Upgrade to Pro' : 'Daily Limit Reached'}
                        </h2>
                        <p className="text-white/80 text-sm">
                            {paymentSuccess
                                ? 'Welcome to Aurem Pro! Activating your account...'
                                : showPayment
                                    ? 'Enter your payment details below'
                                    : isDirectUpgrade
                                        ? 'Unlock unlimited access to all features'
                                        : `You've used all your free ${featureName} for today`
                            }
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 -mt-6">
                    {!showPayment ? (
                        /* Benefits View */
                        <div className={`rounded-2xl p-6 border-2 border-orange-500/30 ${isDark ? 'bg-orange-500/5' : 'bg-orange-50'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-6 h-6 text-orange-500" />
                                    <span className="font-black text-lg text-orange-500">AUREM PRO</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-orange-500">₹499</span>
                                    <span className="text-sm text-gray-500">/month</span>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-6">
                                {[
                                    { icon: Infinity, text: 'Unlimited Doubt Solving' },
                                    { icon: GraduationCap, text: 'Unlimited College Compass' },
                                    { icon: Mic, text: 'Unlimited 15-min Podcasts' },
                                    { icon: Brain, text: 'Unlimited Quiz & Assessments' },
                                    { icon: Zap, text: 'Premium AI for better responses' }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                                            <item.icon className="w-4 h-4 text-orange-500" />
                                        </div>
                                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {item.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={handleUpgradeClick}
                                className="w-full py-4 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white rounded-xl font-black text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] transition-all"
                            >
                                Upgrade to Pro — ₹499/month
                            </button>

                            <p className="text-center text-xs text-gray-500 mt-3">
                                Cancel anytime • 7-day money back guarantee
                            </p>
                        </div>
                    ) : (
                        /* Payment Form View */
                        <div className={`rounded-2xl p-6 border-2 border-orange-500/30 ${isDark ? 'bg-orange-500/5' : 'bg-orange-50'}`}>
                            {!paymentSuccess ? (
                                <>
                                    <div className="space-y-4 mb-6">
                                        {/* Card Number */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Card Number
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="4242 4242 4242 4242"
                                                className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all`}
                                            />
                                        </div>

                                        {/* Expiry and CVV */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Expiry Date
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="MM/YY"
                                                    className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all`}
                                                />
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    CVV
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="123"
                                                    className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all`}
                                                />
                                            </div>
                                        </div>

                                        {/* Name */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Cardholder Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="John Doe"
                                                className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all`}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handlePayment}
                                        disabled={isProcessing}
                                        className="w-full py-4 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white rounded-xl font-black text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="w-5 h-5" />
                                                Pay ₹499
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setShowPayment(false)}
                                        className="w-full mt-3 py-2 text-gray-500 font-medium text-sm hover:text-gray-700 transition-colors"
                                    >
                                        ← Back to Plans
                                    </button>

                                    <p className="text-center text-xs text-gray-500 mt-3">
                                        🔒 Secured by Stripe • Your data is encrypted
                                    </p>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-20 h-20 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                                        <Check className="w-10 h-10 text-green-500" />
                                    </div>
                                    <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        Welcome to Pro!
                                    </h3>
                                    <p className="text-gray-500">
                                        Activating your unlimited access...
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Alternative - only show on first screen */}
                    {!showPayment && (
                        <button
                            onClick={handleClose}
                            className="w-full mt-4 py-3 text-gray-500 font-medium text-sm hover:text-gray-700 transition-colors"
                        >
                            Maybe Later — Come Back Tomorrow
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
