import tailwindcssAnimate from "tailwindcss-animate"

const config = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2962FF",
          50: "#E8EEFF",
          100: "#D1DCFF",
          200: "#A3B9FF",
          300: "#7596FF",
          400: "#4773FF",
          500: "#2962FF",
          600: "#1F4ECE",
          700: "#173B9C",
          800: "#0F286B",
          900: "#08173D",
        },
        brandAccent: {
          DEFAULT: "#A4FF00",
          50: "#F5FFDB",
          100: "#EAFFB8",
          200: "#D4FF70",
          300: "#BEFF29",
          400: "#A4FF00",
          500: "#83CC00",
          600: "#65A000",
          700: "#487400",
          800: "#2C4900",
          900: "#121E00",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
