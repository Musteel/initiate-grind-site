import type { Metadata } from "next";
import "./globals.css";
// import { Navbar } from "@/components/layout/Navbar"; TODO: Re-add Navbar after fixing the hydration error
// import { Footer } from "@/components/layout/Footer"; TODO: Re-add Footer after fixing the hydration error
import { SupabaseProvider } from "@/lib/supabase/SupabaseProvider";

export const metadata: Metadata = {
  title: {
    default: "Initiate Grind — Deadlock Training Platform",
    template: "%s | Initiate Grind",
  },
  description:
    "Get familiar with Deadlock and enjoy solving community puzzles.",
  keywords: ["Deadlock", "Deadlock puzzles"],
  openGraph: {
    title: "Initiate Grind",
    description: "The free community-driven puzzle platform for Deadlock.",
    url: "https://initiategrind.gg",
    siteName: "Initiate Grind",
    type: "website",
  },
  icons: {
    icon: "/assets/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex flex-col min-h-screen">
        <SupabaseProvider>
          {/* <Navbar /> TODO: Re-add Navbar after fixing the hydration error */}
          <main className="flex-1">
            {children}
          </main>
          {/* <Footer /> TODO: Re-add Footer after fixing the hydration error */}
        </SupabaseProvider>
      </body>
    </html>
  );
}

