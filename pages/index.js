import Head from "next/head";
import Image from "next/image";
import { useState, useEffect } from "react";
import Web3 from "web3";
import styles from "../styles/Home.module.css";
import ExpandIcon from "./components/ExpandIcon";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
let timeArr = [];
let seriesArr = [];
let buyPrices = [];
let currentCollection = false;
let interval = 86400000;
let address; /* = "0x7e99430280a0640a4907ccf9dc16c3d41be6e1ed"; */

export default function Home() {
  let [balance, setBalance] = useState(null);
  let [NFTS, setNFTS] = useState(null);
  let [options, setOptions] = useState({});
  let [series, setSeries] = useState([{}]);
  let [updates, setUpdates] = useState(null);
  let value;
  let web3 = new Web3("https://mainnet.infura.io/v3/85053130ed044a1593252260977bbeb5");

  let timestampGen = function () {
    let today = new Date();
    let date = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let dateTime = date + " " + time;
    return dateTime;
  };

  function groupBy(arr, property) {
    return arr.reduce(function (memo, x) {
      if (!memo[x[property]]) {
        memo[x[property]] = [];
      }
      memo[x[property]].push(x);
      return memo;
    }, {});
  }

  let getNFTS = function () {
    fetch(
      `https://deep-index.moralis.io/api/v2/${address}/nft?chain=eth&format=decimal&order=token_address.ASC`,
      {
        method: "GET",
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-api-key": "Q3Zg3JYiD2uaEbeyeVtHVOfdQDN2ERvqqVX7M15HHa2kXq1uBIy1BpM9hk918OLV",
        },
      }
    ).then((nfts) => {
      nfts.json().then((nfts) => {
        nfts = groupBy(nfts.result, "name");
        nfts = Object.entries(nfts);
        setNFTS(nfts);
        console.log("nfts found");
      });
    });
  };

  let getBuyPrices = function () {
    fetch(
      `https://deep-index.moralis.io/api/v2/${address}/nft/transfers?chain=eth&format=decimal&direction=both`,
      {
        method: "GET",
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-api-key": "Q3Zg3JYiD2uaEbeyeVtHVOfdQDN2ERvqqVX7M15HHa2kXq1uBIy1BpM9hk918OLV",
        },
      }
    ).then((res) => {
      res.json().then((nfts) => {
        nfts.result.map((nft) => {
          buyPrices.push([nft.token_address, nft.token_id, web3.utils.fromWei(nft.value, "ether")]);
        });
      });
    });
  };

  let getFloorPrice = function (collection_addr, collection_name) {
    return function () {
      let collectionChanged;

      fetch(`https://api.opensea.io/api/v1/collections?asset_owner=${address}&offset=0&limit=300`).then(
        (collections) => {
          if (currentCollection == collection_name) {
            collectionChanged = false;
            let dateTime = timestampGen();
            timeArr.push(dateTime);
          } else {
            collectionChanged = true;
            timeArr = [];
            seriesArr = [];
            let dateTime = timestampGen();
            timeArr.push(dateTime);
            currentCollection = collection_name;
          }

          collections.json().then((collections) => {
            collections.map((collection) => {
              if (collection_addr == collection?.primary_asset_contracts[0]?.address) {
                seriesArr.push(collection.stats.floor_price);
                setOptions({
                  xaxis: {
                    categories: timeArr,
                  },
                  colors: ["#00c234"],
                  fill: {
                    type: "gradient",
                    gradient: {
                      shadeIntensity: 1,
                      opacityFrom: 0.7,
                      opacityTo: 0.9,
                      stops: [0, 90, 100],
                    },
                  },
                });
                setSeries([{ name: collection_name, data: seriesArr }]);
              }
            });
          });
        }
      );

      var autoCall = setInterval(function () {
        fetch(`https://api.opensea.io/api/v1/collections?asset_owner=${address}&offset=0&limit=300`).then(
          (collections) => {
            if (currentCollection == collection_name) {
              collectionChanged = false;
              let dateTime = timestampGen();
              timeArr.push(dateTime);
            } else {
              if (!collectionChanged) {
                clearInterval(autoCall);
              }
              collectionChanged = true;
              timeArr = [];
              seriesArr = [];
              let dateTime = timestampGen();
              timeArr.push(dateTime);
              currentCollection = collection_name;
            }

            collections.json().then((collections) => {
              collections.map((collection) => {
                if (collection_addr == collection?.primary_asset_contracts[0]?.address) {
                  seriesArr.push(collection.stats.floor_price);
                  setOptions({
                    xaxis: {
                      categories: timeArr,
                    },
                  });
                  setSeries([{ name: collection_name, data: seriesArr }]);
                }
              });
            });
          }
        );
      }, interval);
    };
  };

  useEffect(() => {
    if (updates) {
      web3.eth.getBalance(address, (err, bal) => {
        bal = web3.utils.fromWei(bal.toString(), "ether");
        setBalance(bal);
      });
      getBuyPrices();
    }
  });

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto+Slab:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>
      {address ? (
        <>
          <div className={styles.container}>
            <div className={`${styles.topLeft} ${styles.card}`}>
              <h1 style={{ fontFamily: "playfair display", fontWeight: 900 }}>User Balance:</h1>
              <h4 style={{ fontFamily: "roboto slab", fontWeight: 200 }}>
                {balance} <b style={{ fontFamily: "playfair display", fontWeight: 900 }}>ETH</b>
              </h4>
            </div>
            <div
              style={{
                width: "66%",
                height: "82%",
                border: "1px solid #dedede",
                borderRadius: "20px",
                padding: "1rem",
                position: "relative",
                overflowY: "scroll",
              }}>
              {/* <button
            className={styles.btnBig}
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              zIndex: "999999",
              fontFamily: "roboto slab",
            }}
            onClick={() => {
              getNFTS();
              getBuyPrices();
            }}>
            Refresh
          </button> */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {NFTS ? (
                  NFTS.length > 0 ? (
                    NFTS.map((collection) => {
                      return (
                        <>
                          <div style={{ float: "none", width: "100%" }}>
                            <div>
                              <h1>
                                {collection[0]}
                                <button
                                  id={collection[1][0].token_address}
                                  onClick={getFloorPrice(collection[1][0].token_address, collection[0])}
                                  style={{ margin: "0 0 0 1rem" }}
                                  className={styles.btnBig}>
                                  View Floor Price Graph
                                </button>
                              </h1>
                              <hr></hr>
                            </div>
                            {collection[1].map((nft) => {
                              buyPrices.map((buyPrice) => {
                                if (buyPrice[0] == nft.token_address && buyPrice[1] == nft.token_id) {
                                  value = buyPrice[2];
                                }
                              });
                              let nft_metadata = JSON.parse(nft.metadata);
                              return (
                                <div
                                  key={Math.random() * 10000000000000}
                                  className={styles.card}
                                  style={{
                                    float: "left",
                                    width: "30%",
                                    height: "25rem",
                                    margin: "1rem",
                                    position: "relative",
                                    textAlign: "center",
                                  }}>
                                  <h2 style={{ margin: "1rem" }}>
                                    {nft_metadata
                                      ? nft_metadata.name
                                        ? nft_metadata.name
                                        : `${nft.name} ${nft.token_id}`
                                      : `${nft.name} ${nft.token_id}`}
                                  </h2>
                                  <img
                                    src={`${nft_metadata ? nft_metadata.image : nft.image}`}
                                    style={{
                                      width: "150px",
                                      margin: "9% auto",
                                      border: "1px solid #dedede",
                                      borderRadius: "10px",
                                    }}
                                  />
                                  <h4 style={{ fontFamily: "roboto slab", fontWeight: 200 }}>
                                    {value}{" "}
                                    <b style={{ fontFamily: "playfair display", fontWeight: 900 }}>ETH</b>
                                  </h4>
                                </div>
                              );
                            })}
                          </div>
                          <br />
                        </>
                      );
                    })
                  ) : (
                    <h1
                      style={{
                        height: "fit-content",
                        width: "fit-content",
                        margin: "auto",
                        fontFamily: "playfair display",
                      }}>
                      This address doesn't seem to have any NFT's
                    </h1>
                  )
                ) : (
                  <h1
                    style={{
                      height: "fit-content",
                      width: "fit-content",
                      margin: "auto",
                      fontFamily: "playfair display",
                    }}>
                    Loading...{getNFTS()}
                  </h1>
                )}
              </div>
            </div>
          </div>
          <div
            className={styles.topRight}
            style={{ position: "absolute", width: "15%", height: "20%", margin: "10rem 1rem" }}>
            <h1>{currentCollection}</h1>
            <Chart
              id="floorPriceChart"
              options={options}
              series={series}
              type="area"
              width="100%"
              height="100%"></Chart>
            <button
              style={{ margin: "0 0 0 1rem", float: "right", fontSize: "10px", padding: "0.5rem 2rem" }}
              className={styles.btnBig}>
              <ExpandIcon style={{ width: "14px", height: "14px" }}></ExpandIcon>
              Expand
            </button>
          </div>
        </>
      ) : (
        <div className={styles.container}>
          <div
            style={{
              width: "40%",
              height: "80%",
              border: "1px solid #dedede",
              borderRadius: "20px",
              padding: "1rem",
              position: "relative",
              overflowY: "scroll",
              margin: "auto",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}>
            <h1
              style={{
                fontFamily: "playfair display",
                fontWeight: 900,
                margin: "-20rem 0px 15rem 0px",
                fontSize: "64px",
              }}>
              NFT Tracker
            </h1>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <input
                id="walletAddrInput"
                style={{
                  width: "20vw",
                  height: "5vh",
                  border: "1px solid #d1d1d1",
                  borderRadius: "20px 0 0 20px",
                  fontFamily: "roboto slab",
                  padding: "1rem",
                  textAlign: "center",
                  fontSize: "20px",
                  borderRight: "none",
                }}
                type="text"
                placeholder="Enter Your Wallet Address"
              />
              <button
                style={{
                  borderRadius: "0px 20px 20px 0px",
                  margin: "0",
                  height: "5vh",
                  border: "1px solid #d1d1d1",
                  backgroundColor: "#00c234",
                  color: "white",
                }}
                onClick={() => {
                  if (walletAddrInput.value) {
                    console.log(walletAddrInput.value);
                    address = walletAddrInput.value;
                    setUpdates(true);
                  } else {
                    window.alert("Please fill out the wallet address");
                  }
                }}
                className={styles.btnBig}>
                SUBMIT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
