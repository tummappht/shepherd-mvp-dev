import { SocketStatusProvider } from "@/context/SocketStatusContext";
import "./globals.css";
import Providers from "@/components/layouts/Provider";

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
        <Providers>
          <SocketStatusProvider>{children}</SocketStatusProvider>
        </Providers>
      </body>
    </html>
  );
}
