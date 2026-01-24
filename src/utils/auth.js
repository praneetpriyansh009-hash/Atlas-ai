// MOCK AUTH for Client-Only Mode
// This file bypasses the backend server to allow the UI to function without a running API.

export const loginUser = async (email, password) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const user = {
                id: 'mock-user-id',
                username: email.split('@')[0],
                email: email,
                isPremium: false
            };
            localStorage.setItem('token', 'mock-jwt-token');
            localStorage.setItem('user', JSON.stringify(user));
            resolve({ token: 'mock-jwt-token', user });
        }, 1000);
    });
};

export const registerUser = async (username, email, password) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const user = {
                id: 'mock-user-id',
                username: username,
                email: email,
                isPremium: false
            };
            localStorage.setItem('token', 'mock-jwt-token');
            localStorage.setItem('user', JSON.stringify(user));
            resolve({ token: 'mock-jwt-token', user });
        }, 1000);
    });
};

export const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
};

export const getToken = () => {
    return localStorage.getItem('token');
};
