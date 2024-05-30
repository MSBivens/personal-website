import { Inter } from "next/font/google";
import Navbar from "./components/navbar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Michael Bivens, Personal Web Site",
  description: "Software ENGR Student | Podcaster | Writer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main>
          <Navbar />
          {children}
        </main>
      </body>
    </html>
  );
}
