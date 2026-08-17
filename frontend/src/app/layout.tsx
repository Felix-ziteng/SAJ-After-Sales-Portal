import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { ConfirmProvider } from "@/lib/confirm/ConfirmProvider";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { AppHeader } from "@/components/layout/AppHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "After-Sales Portal",
  description: "After-Sales Service & Warehouse Workflow Portal",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <LocaleProvider>
          <AuthProvider>
            <ConfirmProvider>
              <AppHeader />
              {children}
            </ConfirmProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
