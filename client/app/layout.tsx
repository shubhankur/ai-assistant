import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@livekit/components-styles';
import NavBar from '../components/NavBar';
import SideNav from '../components/SideNav';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Assistant",
  description: "Your AI powered personal assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}>
          <NavBar />
          <div className="flex">
            <SideNav />
            <div className="flex-1">
              {children}
            </div>
          </div>
      </body>
    </html>
  );
}
