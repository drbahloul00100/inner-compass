import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    // suppressHydrationWarning: LanguageProvider updates lang/dir on the client
    // after reading localStorage; the attribute mismatch is intentional.
    <Html lang="en" suppressHydrationWarning>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="bg-paper">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
