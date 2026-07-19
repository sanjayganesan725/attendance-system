/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#111827", // Dark Gray/Slate-900
        accent: "#2563EB",  // Vibrant Accent Blue
        bgApp: "#F8FAFC",   // Slate-50 Background
        borderLight: "#E2E8F0" // Slate-200 Border
      },
      borderRadius: {
        'custom': '12px'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
      }
    },
  },
  plugins: [],
}
