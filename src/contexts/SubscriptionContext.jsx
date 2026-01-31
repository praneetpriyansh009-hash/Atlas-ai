import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

export const useSubscription = () => useContext(SubscriptionContext);

// Daily limits for Basic tier
const BASIC_LIMITS = {
    'college-compass': 1,
    'podcast': 1,
    'quiz': 2,
    'mindmap': 2,
    // Doubt Solver and Document Study core are UNLIMITED
};

// Check if we're in dev/testing mode
const isDevMode = () => {
    try {
        return import.meta.env.VITE_DEV_MODE === 'true';
    } catch {
        return false;
    }
};

const getDefaultTier = () => {
    try {
        const tier = import.meta.env.VITE_DEFAULT_TIER;
        if (tier === 'pro' || tier === 'dev') return tier;
        return 'basic';
    } catch {
        return 'basic';
    }
};

export const SubscriptionProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [tier, setTier] = useState(getDefaultTier());
    const [dailyUsage, setDailyUsage] = useState({});
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeFeature, setUpgradeFeature] = useState('');

    // Load subscription tier from localStorage for the current user
    useEffect(() => {
        if (currentUser?.uid) {
            const storedTier = localStorage.getItem(`aurem_tier_${currentUser.uid}`);
            if (storedTier === 'pro' || storedTier === 'dev') {
                setTier(storedTier);
            } else {
                setTier(getDefaultTier());
            }
        } else {
            setTier(getDefaultTier());
        }
    }, [currentUser]);

    // Load usage from localStorage on mount
    useEffect(() => {
        const storedData = localStorage.getItem('aurem_usage');
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                const today = new Date().toDateString();

                // Reset if it's a new day
                if (parsed.date !== today) {
                    setDailyUsage({});
                    localStorage.setItem('aurem_usage', JSON.stringify({ date: today, usage: {} }));
                } else {
                    setDailyUsage(parsed.usage || {});
                }
            } catch {
                setDailyUsage({});
            }
        }
    }, []);

    // Save usage to localStorage when it changes
    useEffect(() => {
        const today = new Date().toDateString();
        localStorage.setItem('aurem_usage', JSON.stringify({ date: today, usage: dailyUsage }));
    }, [dailyUsage]);

    // Check if user can use a feature
    const canUseFeature = (feature) => {
        // Dev mode or Pro tier = unlimited
        if (isDevMode() || tier === 'dev' || tier === 'pro') {
            return true;
        }

        // Features without limits (Doubt Solver, Document Study core)
        if (!BASIC_LIMITS[feature]) {
            return true;
        }

        // Check daily limit
        const currentUsage = dailyUsage[feature] || 0;
        return currentUsage < BASIC_LIMITS[feature];
    };

    // Increment usage for a feature
    const incrementUsage = (feature) => {
        if (!BASIC_LIMITS[feature]) return; // No tracking for unlimited features

        setDailyUsage(prev => ({
            ...prev,
            [feature]: (prev[feature] || 0) + 1
        }));
    };

    // Get remaining uses for a feature
    const getRemainingUses = (feature) => {
        if (isDevMode() || tier === 'dev' || tier === 'pro') {
            return Infinity;
        }

        if (!BASIC_LIMITS[feature]) {
            return Infinity;
        }

        const currentUsage = dailyUsage[feature] || 0;
        return Math.max(0, BASIC_LIMITS[feature] - currentUsage);
    };

    // Trigger upgrade modal
    const triggerUpgradeModal = (feature) => {
        setUpgradeFeature(feature);
        setShowUpgradeModal(true);
    };

    // Upgrade to pro - persists to localStorage
    const upgradeToPro = () => {
        setTier('pro');
        if (currentUser?.uid) {
            localStorage.setItem(`aurem_tier_${currentUser.uid}`, 'pro');
        }
        setShowUpgradeModal(false);
    };

    // Downgrade to basic - persists to localStorage
    const downgradeToBasic = () => {
        setTier('basic');
        if (currentUser?.uid) {
            localStorage.removeItem(`aurem_tier_${currentUser.uid}`);
        }
    };

    const value = {
        tier,
        setTier,
        canUseFeature,
        incrementUsage,
        getRemainingUses,
        showUpgradeModal,
        setShowUpgradeModal,
        upgradeFeature,
        triggerUpgradeModal,
        upgradeToPro,
        downgradeToBasic,
        isDevMode: isDevMode(),
        isPro: tier === 'pro' || tier === 'dev' || isDevMode(),
        BASIC_LIMITS
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};
