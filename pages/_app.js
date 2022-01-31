import "../styles/globals.css";
import Script from "next/script";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <head>
        <Script src="./ads-prebid.js"></Script>
        <Script src="./ads.js"></Script>
        <Script src="./prebid-ads.js"></Script>
      </head>
      {(function () {
        if (
          window.canRunAds1 === undefined ||
          window.canRunAds2 === undefined ||
          window.canRunAds3 === undefined
        ) {
          window.alert(
            "Please dsable any adblockers you have enabled, they stop this application from working as it should"
          );
        }
      })()}
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
