import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Shepherd Security",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex">
        <Navbar />
        <main className="ml-60 p-8 w-full">{children}</main>
      </body>
    </html>
  );
}
