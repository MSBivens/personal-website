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
          <div className="flex flex-col items-center justify-center ">
            <div className="mb-8 space-y-3 w-4/5 md:w-4/5 lg:w-2/5">
              <Navbar />
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
