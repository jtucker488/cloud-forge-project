import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";
import MainLayout from "@/components/layout/MainLayout";
import { Toaster } from 'sonner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cloud Forge",
  description: "Inventory and Quote Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProviders>
          <MainLayout>
            <ProtectedRoute>{children}</ProtectedRoute>
          </MainLayout>
        </AppProviders>
        <Toaster />
      </body>
    </html>
  );
}