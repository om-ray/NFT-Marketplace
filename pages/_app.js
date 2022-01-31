import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
