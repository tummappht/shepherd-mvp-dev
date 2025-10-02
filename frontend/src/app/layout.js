import "./globals.css";
import { SocketStatusProvider } from "@/context/SocketStatusContext";
import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Shepherd Security",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-black text-white">
        <SessionProvider>
          <div className="flex flex-col w-screen h-screen bg-black">
            <div className="flex-1 flex gap-4 p-6 pb-0 overflow-hidden">
              <Sidebar />
              <SocketStatusProvider>
                <main className="flex-1 flex flex-col min-w-0">{children}</main>
              </SocketStatusProvider>
            </div>
            <Footer />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
