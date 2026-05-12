import type { Metadata } from "next";
import "@/app/globals.css";
import { AppFrame } from "@/components/app-frame";
import { AuthProvider } from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "FotoFlow Manager",
  description: "Interni CRM za fotografske projekte, finance in roke."
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
