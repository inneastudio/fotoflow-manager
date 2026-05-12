import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FotoFlow Manager",
  description: "Interni fotografski workflow manager."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl">
      <body>{children}</body>
    </html>
  );
}
