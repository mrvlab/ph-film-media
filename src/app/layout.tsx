import { Lato, Oswald } from "next/font/google";
import "@/app/globals.css";
import { ViewTransitions } from "next-view-transitions";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["600"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata = {
  title: "Ph Film & Media",
  appleWebApp: {
    title: "PH Film",
  },
  icons: {
    icon: "/icon1.png",
    apple: "/apple-icon.png",
    other: [{ rel: "mask-icon", url: "/icon0.svg", color: "#fff" }],
  },
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html lang="en">
        <body
          className={`grid lg:grid-cols-12 lg:grid-rows-6 lg:gap-x-p-desktop lg:h-screen lg:overflow-hidden antialiased ${lato.variable} ${oswald.variable}`}
        >
          {children}
        </body>
      </html>
    </ViewTransitions>
  );
}
