/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            colors: {
                // Premium Light Mode (Calm Pink Theme)
                warm: {
                    50: '#fff5f5',  // Very pale pink/white (Background)
                    100: '#ffe3e3', // Soft pink
                    200: '#ffc9c9', // Pastel pink accent
                    300: '#fca5a5', // Deeper pink
                    800: '#5c2b2b', // Dark brownish-red (Primary Text)
                    900: '#3E2B22',
                },
                // Premium Dark Mode
                midnight: {
                    800: '#141416',
                    900: '#0A0A0B',
                },
                // Brand Colors
                brand: {
                    primary: '#d95c5c', // Muted coral/red
                    secondary: '#10B981', // Emerald 500
                    accent: '#F59E0B', // Amber 500
                }
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                'glow': '0 0 20px rgba(79, 70, 229, 0.3)',
            }
        },
    },
    plugins: [],
}
