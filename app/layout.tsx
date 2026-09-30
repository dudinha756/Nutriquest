import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriQuest",
  description: "Dieta, consistência e recompensas em um só lugar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
