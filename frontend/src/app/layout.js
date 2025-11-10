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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
