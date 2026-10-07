module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1677FF",
        success: "#52C41A",
        warning: "#FAAD14",
        danger: "#FF4D4F",
        ink: "#1F1F1F",
        muted: "#8C8C8C",
        line: "#D9D9D9",
        canvas: "#F5F5F5",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.08)",
      },
      maxWidth: {
        page: "1440px",
      },
    },
  },
  plugins: [],
};
