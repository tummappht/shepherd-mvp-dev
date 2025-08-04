import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "Shepherd Security",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-screen">
          <div className="flex flex-col h-full">
            <Header />
            <main className="flex-1 relative overflow-auto">{children}</main>
          </div>
      </body>
    </html>
  );
}
