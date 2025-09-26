import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SocketStatusProvider } from "@/context/SocketStatusContext";
import { SessionProvider } from "next-auth/react";

export const metadata = {
  title: "Shepherd Security",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-screen">
        <SessionProvider>
          <div className="flex flex-col h-full">
            <Header />
            <SocketStatusProvider>
              <main className="flex flex-col flex-1 relative bg-black">
                {children}
              </main>
            </SocketStatusProvider>
            <Footer />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
