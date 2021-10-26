import Head from "next/head";
import Image from "next/image";
import { useState, useEffect } from "react";
import Web3 from "web3";
import styles from "../styles/Home.module.css";
import ExpandIcon from "./components/ExpandIcon";
import dynamic from "next/dynamic";
import MinimizeIcon from "./components/MinimizeIcon";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
let timeArr = [];
let seriesArr = [];
let buyPrices = [];
let collectionBuyPriceArr = [];
let dayGroupArr = [];
let groupArr = [];
let currentCollection = false;
let currentCollectionAddress = false;
let totalLoopsNeeded;
let DBUrl;
let initalQueryOffset = 0;

let interval = 86400000;
let address; /* = "0x7e99430280a0640a4907ccf9dc16c3d41be6e1ed"; */

export default function Home() {
  let [updates, setUpdates] = useState(() => null);
  let [balance, setBalance] = useState(() => null);
  let [NFTS, setNFTS] = useState(() => null);
  let [options, setOptions] = useState(() => {
    return {};
  });
  let [series, setSeries] = useState(() => [{}]);
  let [bigoptions, setBigOptions] = useState(() => {
    return {};
  });
  let [bigseries, setBigSeries] = useState(() => [{}]);
  let [expandGraph, setExpandGraph] = useState(() => false);
  let value;
  console.log(process.env);
  if (typeof process !== "undefined") {
    DBUrl = `http://localhost:${process.env.NEXT_PUBLIC_PORT}/graphql`;
  }
  let web3 = new Web3("https://speedy-nodes-nyc.moralis.io/1c58af41ad51021daa7433bb/eth/mainnet");

  let average = (arr) => (arr.reduce((a, b) => a + b) / arr.length).toFixed(0);

  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

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

  let populateNFTDataDB = function (collection_addr) {
    fetch(DBUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
      query MyQuery {
        allNftData(condition: {tokenAddress: "${collection_addr}"}, orderBy: TIMESTAMP_DESC) {
          nodes {
            timestamp
            tokenAddress
            value
          }
        }
      }
      `,
      }),
    }).then((NFTData) => {
      NFTData.json().then((NFTData) => {
        initalQueryOffset = NFTData.data.allNftData.nodes.length;
      });
    });

    fetch(
      `https://deep-index.moralis.io/api/v2/nft/${collection_addr}/transfers?chain=eth&format=decimal&limit=1&order=block_timestamp.DESC`,
      {
        method: "GET",
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-api-key": "Q3Zg3JYiD2uaEbeyeVtHVOfdQDN2ERvqqVX7M15HHa2kXq1uBIy1BpM9hk918OLV",
        },
      }
    ).then((tokens) => {
      tokens.json().then((tokens) => {
        totalLoopsNeeded = Math.ceil((tokens.total - initalQueryOffset) / 500);
        console.log("populating db", totalLoopsNeeded);
        let i = 0;
        var runMutation = setInterval(() => {
          if (i <= totalLoopsNeeded) {
            let queryOffset = i * 500 + initalQueryOffset;
            fetch(
              `https://deep-index.moralis.io/api/v2/nft/${collection_addr}/transfers?chain=eth&format=decimal&offset=${queryOffset}&order=block_timestamp.DESC`,
              {
                method: "GET",
                headers: {
                  "content-type": "application/json; charset=utf-8",
                  "x-api-key": "Q3Zg3JYiD2uaEbeyeVtHVOfdQDN2ERvqqVX7M15HHa2kXq1uBIy1BpM9hk918OLV",
                },
              }
            ).then((tokens) => {
              tokens
                .json()
                .then((tokens) => {
                  tokens.result.map(async (token) => {
                    await fetch(DBUrl, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        query: `
                          mutation MyMutation {
                            createNftDatum(input: {nftDatum: {value: "${token.value}", timestamp: "${token.block_timestamp}", tokenAddress: "${token.token_address}"}}) {
                              nftDatum {
                                timestamp
                                tokenAddress
                                value
                              }
                            }
                          }`,
                      }),
                    })
                      .then((NFTData) => {
                        NFTData.json()
                          .then((NFTData) => {
                            console.log(NFTData);
                          })
                          .catch((err) => {
                            console.error(err);
                          });
                      })
                      .catch((err) => {
                        console.error(err);
                      });
                  });
                })
                .catch((err) => {
                  console.error(err);
                });
            });
            i += 1;
          } else {
            clearInterval(runMutation);
          }
        }, 1000);
      });
    });
  };

  let makeBigAvgBuyPriceGraph = function (collection_addr) {
    seriesArr = [];
    groupArr = [];
    fetch(DBUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query MyQuery {
            allNftData(
              condition: {tokenAddress: "${collection_addr}"}
              orderBy: TIMESTAMP_DESC
              ) {
                nodes {
                  timestamp
                  tokenAddress
                  value
                }
              }
            }`,
      }),
    })
      .then((tokens) => {
        tokens
          .json()
          .then((tokens) => {
            timeArr = [];
            collectionBuyPriceArr = [];
            tokens.data.allNftData.nodes.map((token) => {
              timeArr.push(token.timestamp.split("T")[0]);
              collectionBuyPriceArr.push([token.timestamp.split("T")[0], JSON.parse(token.value)]);
              if (collectionBuyPriceArr.length == tokens.data.allNftData.nodes.length) {
                timeArr = timeArr.filter(onlyUnique);
                timeArr.sort(function (x, y) {
                  return x - y;
                });
                timeArr.reverse();
                collectionBuyPriceArr.sort(function (x, y) {
                  return x[0] - y[0];
                });
                collectionBuyPriceArr.reverse();
                for (let i in collectionBuyPriceArr) {
                  let token = collectionBuyPriceArr[i];
                  let lastTimestamp = collectionBuyPriceArr[i - 1]
                    ? collectionBuyPriceArr[i - 1][0]
                    : token[0];
                  if (token[0]) {
                    if (token[0] == lastTimestamp) {
                      dayGroupArr.push(token[1]);
                    } else if (token[0] !== lastTimestamp) {
                      groupArr.push(dayGroupArr);
                      dayGroupArr = [];
                      dayGroupArr.push(token[1]);
                      if (token[0] == collectionBuyPriceArr[collectionBuyPriceArr.length - 1][0]) {
                        groupArr.push(dayGroupArr);
                      }
                    }
                  }
                }
                for (let i in groupArr) {
                  let group = groupArr[i];
                  group = average(group);
                  seriesArr.push(web3.utils.fromWei(group.toString(), "ether"));
                }
              }
            });
            setBigOptions({
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
                  stops: [0, 100],
                },
              },
              noData: {
                text: "No data to show",
                align: "center",
                verticalAlign: "middle",
              },
            });
            setBigSeries([{ name: currentCollection, data: seriesArr }]);
          })
          .catch((err) => {
            console.error(err);
          });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  let makeSmallAvgBuyPriceGraph = function (tokens, collection_name) {
    currentCollection = collection_name;
    tokens.json().then((tokens) => {
      tokens.result.map((token) => {
        timeArr.push(token.block_timestamp.split("T")[0]);
        collectionBuyPriceArr.push([token.block_timestamp.split("T")[0], JSON.parse(token.value)]);
        if (collectionBuyPriceArr.length == tokens.result.length) {
          timeArr = timeArr.filter(onlyUnique);
          timeArr.sort(function (x, y) {
            return x - y;
          });
          timeArr.reverse();
          collectionBuyPriceArr.sort(function (x, y) {
            return x[0] - y[0];
          });
          collectionBuyPriceArr.reverse();
          for (let i in collectionBuyPriceArr) {
            let token = collectionBuyPriceArr[i];
            let lastTimestamp = collectionBuyPriceArr[i - 1] ? collectionBuyPriceArr[i - 1][0] : token[0];
            if (token[0] == lastTimestamp) {
              dayGroupArr.push(token[1]);
            } else {
              groupArr.push(dayGroupArr);
              dayGroupArr = [];
              dayGroupArr.push(token[1]);
              if (token[0] == collectionBuyPriceArr[collectionBuyPriceArr.length - 1][0]) {
                groupArr.push(dayGroupArr);
              }
            }
          }
          for (let i in groupArr) {
            let group = groupArr[i];
            group = average(group);
            seriesArr.push(web3.utils.fromWei(group.toString(), "ether"));
          }
        }
      });
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
            stops: [0, 100],
          },
        },
        noData: {
          text: "No data to show",
          align: "center",
          verticalAlign: "middle",
        },
      });
      setSeries([{ name: collection_name, data: seriesArr }]);
    });
  };

  let getAvgBuyPrice = function (collection_addr, collection_name) {
    return function () {
      let collectionChanged;
      populateNFTDataDB(collection_addr);
      currentCollectionAddress = collection_addr;
      console.log(collection_addr);
      fetch(
        `https://deep-index.moralis.io/api/v2/nft/${collection_addr}/transfers?chain=eth&format=decimal&order=block_timestamp.DESC`,
        {
          method: "GET",
          headers: {
            "content-type": "application/json; charset=utf-8",
            "x-api-key": "Q3Zg3JYiD2uaEbeyeVtHVOfdQDN2ERvqqVX7M15HHa2kXq1uBIy1BpM9hk918OLV",
          },
        }
      ).then((tokens) => {
        if (currentCollection == collection_name) {
          collectionChanged = false;
        } else {
          collectionChanged = true;
          timeArr = [];
          seriesArr = [];
          collectionBuyPriceArr = [];
          dayGroupArr = [];
          groupArr = [];
          currentCollection = collection_name;
        }

        makeSmallAvgBuyPriceGraph(tokens, collection_name);
      });

      var autoCall = setInterval(function () {
        fetch(
          `https://deep-index.moralis.io/api/v2/nft/${collection_addr}/transfers?chain=eth&format=decimal&order=block_timestamp.ASC`,
          {
            method: "GET",
            headers: {
              "content-type": "application/json; charset=utf-8",
              "x-api-key": "Q3Zg3JYiD2uaEbeyeVtHVOfdQDN2ERvqqVX7M15HHa2kXq1uBIy1BpM9hk918OLV",
            },
          }
        ).then((tokens) => {
          if (currentCollection == collection_name) {
            collectionChanged = false;
          } else {
            if (!collectionChanged) {
              clearInterval(autoCall);
            }
            collectionChanged = true;
            timeArr = [];
            seriesArr = [];
            currentCollection = collection_name;
          }

          makeSmallAvgBuyPriceGraph(tokens, collection_name);
        });
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
                                  onClick={getAvgBuyPrice(collection[1][0].token_address, collection[0])}
                                  style={{ margin: "0 0 0 1rem" }}
                                  className={styles.btnBig}>
                                  View Avg. Buy Price Graph
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
                      This address doesn&#39;t seem to have any NFT&#39;s
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
          {expandGraph ? (
            <div
              className={styles.container}
              style={{
                width: "100vw",
                height: "100vh",
                padding: "1rem",
                position: "absolute",
                top: "0",
                left: "0",
                backgroundColor: "rgba(0, 0, 0, 0.2)",
              }}>
              <div
                className={styles.container}
                style={{
                  width: "90%",
                  height: "90%",
                  padding: "0rem 0rem 10rem 0rem",
                  backgroundColor: "white",
                  border: "1px solid #dedede",
                  borderRadius: "20px",
                }}>
                <div style={{ width: "90%", height: "60%" }}>
                  <h1>{currentCollection} Avg. Buy price</h1>
                  <button
                    onClick={() => {
                      setExpandGraph(false);
                      // getAvgBuyPrice(currentCollectionAddress, currentCollection);
                    }}
                    style={{
                      margin: "0 0 0 1rem",
                      float: "right",
                      fontSize: "10px",
                      padding: "0.5rem 2rem",
                      position: "absolute",
                      right: "0",
                      top: "30px",
                    }}
                    className={styles.btnBig}>
                    <MinimizeIcon style={{ width: "14px", height: "14px" }}></MinimizeIcon>
                    Minimize
                  </button>
                  <Chart
                    id="floorPriceChart"
                    options={bigoptions}
                    series={bigseries}
                    type="area"
                    width="100%"
                    height="100%"></Chart>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={styles.topRight}
              style={{ position: "absolute", width: "15%", height: "20%", margin: "10rem 1rem" }}>
              <h1>{currentCollection} Avg. Buy price</h1>
              <Chart
                id="floorPriceChart"
                options={options}
                series={series}
                type="area"
                width="100%"
                height="100%"></Chart>
              <button
                onClick={() => {
                  setExpandGraph(true);
                  makeBigAvgBuyPriceGraph(currentCollectionAddress);
                }}
                style={{ margin: "0 0 0 1rem", float: "right", fontSize: "10px", padding: "0.5rem 2rem" }}
                className={styles.btnBig}>
                <ExpandIcon style={{ width: "14px", height: "14px" }}></ExpandIcon>
                Expand
              </button>
            </div>
          )}
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
