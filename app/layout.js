import "./globals.css";

export const metadata = {
  title: "SIMS – Systematic Innovation Management System",
  description: "Software-native Idea Accelerator using TRIZ, SIT, and C-K Theory",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
