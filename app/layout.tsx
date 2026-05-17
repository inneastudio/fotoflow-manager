import type { Metadata } from "next";
import "@/app/globals.css";
import { AppFrame } from "@/components/app-frame";
import { AuthProvider } from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "FotoFlow Manager",
  description: "Interni CRM za fotografske projekte, finance in roke.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/apple-icon.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FotoFlow"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl">
      <body>
        <AuthProvider>
          <AppFrame>{children}</AppFrame>
        </AuthProvider>
      </body>
    </html>
  );
}
