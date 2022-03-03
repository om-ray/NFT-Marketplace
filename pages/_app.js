import "../styles/globals.css";
import { UserProvider } from "@auth0/nextjs-auth0";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <UserProvider>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <Component {...pageProps} />
      </UserProvider>
    </>
  );
}

export default MyApp;
