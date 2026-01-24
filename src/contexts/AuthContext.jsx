import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error("Google Sign In Error:", error);
            throw error;
        }
    };

    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        console.log("AuthContext: Setting up listener");
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("AuthContext: User Changed", user);
            setCurrentUser(user);
            setLoading(false);
        }, (error) => {
            console.error("AuthContext: Error", error);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loginWithGoogle,
        logout,
        loading
    };

    // Non-blocking loading to prevent white screen (black text on black bg)
    // if (loading) return <div>...</div>;

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
