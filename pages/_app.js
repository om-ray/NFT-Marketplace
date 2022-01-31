import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <head>
        <script src="./ads-prebid.js"></script>
        <script src="./ads.js"></script>
        <script src="./prebid-ads.js"></script>
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
