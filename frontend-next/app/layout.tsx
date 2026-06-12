import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Providers from "./providers";
import { ROLE_COOKIE, DEFAULT_ROLE, isRole } from "@/lib/roles";

export const metadata: Metadata = {
  title: "IIT Patna CCDC",
  description:
    "Training & Placement Cell, IIT Patna — connecting world-class talent with global industry leaders.",
  icons: { icon: "/favicon.svg" },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read the mock role cookie so the role-scoped UI renders correctly on the
  // server (and the first client render agrees — no hydration flash).
  const cookieStore = await cookies();
  const raw = cookieStore.get(ROLE_COOKIE)?.value;
  const initialRole = isRole(raw) ? raw : DEFAULT_ROLE;

  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background antialiased min-h-screen flex flex-col">
        <Providers initialRole={initialRole}>{children}</Providers>
      </body>
    </html>
  );
}
