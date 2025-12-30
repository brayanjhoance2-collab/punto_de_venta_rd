import "./globals.css";
import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/logo.png" sizes="any" />
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/rsvp/4.8.5/rsvp.min.js"
          strategy="beforeInteractive"
        />
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body suppressHydrationWarning>
        {children}

        <Script
          type="module"
          src="https://cdn.jsdelivr.net/npm/ionicons@7.4.0/dist/ionicons/ionicons.esm.js"
          strategy="afterInteractive"
        />
        <Script
          nomodule
          src="https://cdn.jsdelivr.net/npm/ionicons@7.4.0/dist/ionicons/ionicons.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}