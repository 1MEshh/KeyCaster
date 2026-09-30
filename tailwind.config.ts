import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        main: "var(--main)",
        caret: "var(--caret)",
        sub: "var(--sub)",
        text: "var(--text)",
        error: "var(--error)",
        "error-extra": "var(--error-extra)",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "monospace"],
        thmanyah: ["var(--font-thmanyah)", "sans-serif"],
      },
      animation: {
        pulseFast: "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
