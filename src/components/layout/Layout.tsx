import { ReactNode } from "react";
import Head from "next/head";
import Navigation from "./Navigation";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  hideNav?: boolean;
  hideFooter?: boolean;
}

export default function Layout({
  children,
  title = "Inner Compass",
  description = "A self-awareness assessment that measures how you behave under pressure — not how you describe yourself on a calm day.",
  hideNav = false,
  hideFooter = false,
}: LayoutProps) {
  const fullTitle =
    title === "Inner Compass" ? title : `${title} — Inner Compass`;

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
      </Head>
      <div className="min-h-screen flex flex-col bg-paper text-ink antialiased">
        {!hideNav && <Navigation />}
        <main className="flex-1">{children}</main>
        {!hideFooter && <Footer />}
      </div>
    </>
  );
}
