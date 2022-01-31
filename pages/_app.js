import "../styles/globals.css";
import DetectAdBlock from "./DetectAdBlock";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <DetectAdBlock pathname={window.location.pathname} />
    </>
  );
}

export default MyApp;
