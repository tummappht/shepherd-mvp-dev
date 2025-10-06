import { SocketStatusProvider } from "@/context/SocketStatusContext";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata = {
  title: "Shepherd Security",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-black text-white">
        <SessionProvider>
          <SocketStatusProvider>{children}</SocketStatusProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
