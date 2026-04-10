import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  const themeBootScript = `
    (function () {
      try {
        var savedTheme = localStorage.getItem('theme');
        var preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var theme = savedTheme || (preferDark ? 'dark' : 'light');
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    })();
  `;

  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=Public+Sans:wght@300..700&display=swap"
        />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=Public+Sans:wght@300..700&display=swap" rel="stylesheet" />
      </Head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
