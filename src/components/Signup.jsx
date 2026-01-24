import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { registerUser } from '../utils/auth';
import { AlertCircle, Loader2 } from './Icons';

const Signup = ({ onSignupSuccess, onSwitchToLogin }) => {
    const { isDark } = useTheme();
    const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const data = await registerUser(formData.username, formData.email, formData.password);
            onSignupSuccess(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-theme-primary p-6">
            <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">Join Atlas</h2>

                {error && (
                    <div className={`${isDark ? 'bg-red-500/10 border-red-500/20 text-red-200' : 'bg-red-100 border-red-200 text-red-600'} border p-3 rounded-lg mb-4 flex items-center text-sm`}>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-theme-muted mb-1">Username</label>
                        <input
                            type="text"
                            required
                            className={`w-full ${isDark ? 'bg-slate-950/50' : 'bg-warm-200'} border rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-theme-muted`}
                            style={{ borderColor: 'var(--border-color)' }}
                            placeholder="Student123"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-muted mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className={`w-full ${isDark ? 'bg-slate-950/50' : 'bg-warm-200'} border rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-theme-muted`}
                            style={{ borderColor: 'var(--border-color)' }}
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-muted mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className={`w-full ${isDark ? 'bg-slate-950/50' : 'bg-warm-200'} border rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-theme-muted`}
                            style={{ borderColor: 'var(--border-color)' }}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-muted mb-1">Confirm Password</label>
                        <input
                            type="password"
                            required
                            className={`w-full ${isDark ? 'bg-slate-950/50' : 'bg-warm-200'} border rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-theme-muted`}
                            style={{ borderColor: 'var(--border-color)' }}
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-theme-muted">
                    Already have an account?{' '}
                    <button onClick={onSwitchToLogin} className="text-purple-500 hover:text-purple-400 font-medium transition-colors">
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Signup;
