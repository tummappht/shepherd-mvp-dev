import "./globals.css";
// import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SocketStatusProvider } from "@/context/SocketStatusContext";
import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/layout/Sidebar";

export const metadata = {
  title: "Shepherd Security",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SessionProvider>
          <div className="flex flex-col min-w-full min-h-screen bg-black">
            <div className="flex grow gap-4 p-6 pb-0">
              <Sidebar />
              <SocketStatusProvider>
                <main className="flex flex-col flex-1 relative p-4">
                  {children}
                </main>
              </SocketStatusProvider>
            </div>
            <Footer />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
