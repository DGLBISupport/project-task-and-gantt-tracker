import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import Navbar from "@/components/navbar";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { TaskProvider } from "@/context/task-context";

export const metadata: Metadata = {
  title: "Project Task & Gantt Tracker",
  description: "Track project deliverables and generate downloadable Gantt charts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            <TaskProvider>
              <SidebarProvider defaultOpen>
                <AppSidebar />
                <SidebarInset className="flex h-screen min-h-0 flex-1 flex-col overflow-hidden bg-primary/5">
                  <div className="shrink-0">
                    <Navbar />
                  </div>
                  <main className="min-h-0 flex-1 overflow-y-auto">
                    {children}
                  </main>
                </SidebarInset>
              </SidebarProvider>
            </TaskProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
