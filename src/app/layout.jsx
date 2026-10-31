import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";
export const metadata = {
    title: "BrightLoop - Enterprise Subscription & Revenue Platform",
    description: "Unified subscription management, recurring billing, real-time analytics, and self-service customer portal.",
};
export default function RootLayout({ children, }) {
    return (<html lang="en">
      <body className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>);
}
