import Head from "next/head";
import { useState, useEffect } from "react";
import Web3 from "web3";
import styles from "../styles/Home.module.css";
import ExpandIcon from "./components/ExpandIcon";
import dynamic from "next/dynamic";
import MinimizeIcon from "./components/MinimizeIcon";
import CollapseSidebarArrowIcon from "./components/CollapseSidebarArrowIcon";
import PlusIcon from "./components/PlusIcon";
import { getEthPriceNow } from "get-eth-price";

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
let DBUrl = `http://0.0.0.0:5000/graphql`;
let initalQueryOffset = 0;
let accountData;

export default function Home() {
  let [updates, setUpdates] = useState(() => null);
  let [address, setAddress] = useState(() => null);
  let [balance, setBalance] = useState(() => null);
  let [collapseSideBar, setCollapseSideBar] = useState(() => false);
  let [balanceUSD, setBalanceUSD] = useState(() => null);
  let [NFTS, setNFTS] = useState(() => null);
  let [options, setOptions] = useState(() => {
    return {};
  });
  let [series, setSeries] = useState(() => [{}]);
  let [bigoptions, setBigOptions] = useState(() => {
    return {
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
        text: "Loading",
        align: "center",
        verticalAlign: "middle",
      },
    };
  });
  let [bigseries, setBigSeries] = useState(() => []);
  let [expandGraph, setExpandGraph] = useState(() => false);
  let [hasAccount, setHasAccount] = useState(() => false);
  let [loggedIn, setLoggedIn] = useState(() => false);
  let [addingAddress, setAddingAddress] = useState(() => false);
  let [addressList, setAddressList] = useState(() => []);
  let value;
  let web3 = new Web3("https://speedy-nodes-nyc.moralis.io/1c58af41ad51021daa7433bb/eth/mainnet");

  let convertToUSD = async function (ETH) {
    let test;
    let balUSD;
    await getEthPriceNow("USD").then((data) => {
      test = Object.keys(data)[0];
      balUSD = data[test].ETH.USD * ETH;
    });
    return balUSD.toFixed(2);
  };

  let average = (arr) => (arr.reduce((a, b) => a + b) / arr.length).toFixed(0);

  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

  function groupBy(arr, property) {
    return arr?.reduce(function (memo, x) {
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
        if (nfts) {
          setNFTS(nfts);
        }
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
        nfts?.result?.map((nft) => {
          buyPrices.push([nft.token_address, nft.token_id, web3.utils.fromWei(nft.value, "ether")]);
        });
      });
    });
  };

  let populateNFTDataDB = async function (collection_addr) {
    await fetch("/api/populate_db", {
      method: "POST",
      body: JSON.stringify({ DBUrl: DBUrl, collection_addr: collection_addr }),
    }).then((res) => {
      res.json().then((res) => {
        initalQueryOffset = res;
        console.log(res);
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
        console.log(tokens.total);
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
                    await fetch("/api/create_nft_data", {
                      method: "POST",
                      body: JSON.stringify({
                        DBUrl: DBUrl,
                        token: {
                          value: token.value,
                          block_timestamp: token.block_timestamp,
                          token_address: token.token_address,
                        },
                      }),
                    })
                      .then((NFTData) => {
                        NFTData.json()
                          .then((NFTData) => {})
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
        }, 15000);
      });
    });
  };

  let makeBigAvgBuyPriceGraph = function (collection_addr) {
    seriesArr = [];
    groupArr = [];
    fetch("/api/get_big_graph_data", {
      method: "POST",
      body: JSON.stringify({ DBUrl: DBUrl, collection_addr: collection_addr }),
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
              tools: {
                download: true,
                selection: true,
                zoom: true,
                zoomin: true,
                zoomout: true,
                pan: true,
                reset: true,
              },
              noData: {
                text: "Loading",
                align: "center",
                verticalAlign: "middle",
              },
              yaxis: {
                labels: {
                  formatter: function (val) {
                    return val.toFixed(5);
                  },
                },
              },
              dataLabels: {
                formatter: function (val) {
                  return val.toFixed(2);
                },
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
      tokens?.result?.map((token) => {
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
        yaxis: {
          labels: {
            formatter: function (val) {
              return val.toFixed(5);
            },
          },
        },
        noData: {
          text: "No data to show",
          align: "center",
          verticalAlign: "middle",
        },
        dataLabels: {
          formatter: function (val) {
            return val.toFixed(2);
          },
        },
      });
      setSeries([{ name: collection_name, data: seriesArr }]);
    });
  };

  let getAvgBuyPrice = function (collection_addr, collection_name) {
    return function () {
      if (getComputedStyle(document.getElementsByClassName(styles.smallGraphWrapper)[0]).display == "none") {
        makeBigAvgBuyPriceGraph(collection_addr);
        setExpandGraph(true);
        window.alert("Please use landscape mode on the graph for the best experience");
      }
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
      }, 10000);
    };
  };

  let login = async function (email, password) {
    await findAccount(email, password);
    console.log(accountData);
    if (accountData.data.allAccounts.nodes.length == 0) {
      window.alert("Your email or password is incorrect");
    } else if (accountData.data.allAccounts.nodes.length == 1) {
      if (window) {
        window.sessionStorage.setItem("email", email);
        window.sessionStorage.setItem("password", password);
      }
      setLoggedIn(true);
    }
  };

  let signUp = async function (email, password) {
    await createAccount(email, password);
    if (accountData.errors) {
      window.alert("This email already has an account associated with it");
    } else {
      login(email, password);
    }
  };

  let createAccount = async function (email, password) {
    await fetch("/api/create_account", {
      method: "POST",
      body: JSON.stringify({
        DBUrl: DBUrl,
        email: email,
        password: password,
      }),
    })
      .then(async (response) => {
        await response.json().then((result) => {
          accountData = result;
        });
      })
      .catch((err) => {
        return err;
      });
  };

  let findAccount = async function (email, password) {
    await fetch("/api/find_account", {
      method: "POST",
      body: JSON.stringify({
        DBUrl: DBUrl,
        email: email,
        password: password,
      }),
    })
      .then(async (response) => {
        await response.json().then((result) => {
          accountData = result;
          if (accountData.data.allAccounts.nodes[0].addresses !== null) {
            setAddressList(accountData.data.allAccounts.nodes[0].addresses[0].split(","));
          }
        });
      })
      .catch((err) => {
        return err;
      });
  };

  let updateAccountAddresses = async function (email, addresses) {
    fetch("/api/update_account_addresses", {
      method: "POST",
      body: JSON.stringify({ DBUrl: DBUrl, email: email, addresses: addresses }),
    }).then((result) => {
      result.json().then((result) => {
        return result;
      });
    });
  };

  let addAddress = async function (address) {
    await findAccount(
      accountData.data.allAccounts.nodes[0].email,
      accountData.data.allAccounts.nodes[0].password
    );
    if (accountData.data.allAccounts.nodes[0].addresses == null) {
      await updateAccountAddresses(accountData.data.allAccounts.nodes[0].email, address);
    } else if (accountData.data.allAccounts.nodes[0].addresses[0].split(",").includes(address)) {
      window.alert("This address has already been added");
    } else {
      accountData.data.allAccounts.nodes[0].addresses.push(address);
      await updateAccountAddresses(
        accountData.data.allAccounts.nodes[0].email,
        accountData.data.allAccounts.nodes[0].addresses
      );
    }
  };

  useEffect(() => {
    if (window && !loggedIn) {
      let email = window.sessionStorage.getItem("email");
      let password = window.sessionStorage.getItem("password");
      if (email && password) {
        login(email, password);
      }
    }
    if (updates) {
      web3.eth.getBalance(address, async (err, bal) => {
        bal = web3.utils.fromWei(bal.toString(), "ether");
        setBalance(bal);
        setBalanceUSD(await convertToUSD(bal));
      });
      getNFTS();
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      {loggedIn && address ? (
        <>
          <div style={{ zIndex: "3" }} className={styles.container}>
            <div className={`${styles.topLeft} ${styles.card} ${styles.balanceCard}`}>
              <h1 style={{ fontFamily: "playfair display", fontWeight: 900 }}>User Balance:</h1>
              <h4 style={{ fontFamily: "roboto slab", fontWeight: 200 }}>
                {balance} <b style={{ fontFamily: "playfair display", fontWeight: 900 }}>ETH</b>
              </h4>
            </div>
            <div className={styles.nftWrapper}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {NFTS ? (
                  NFTS.length > 0 ? (
                    NFTS.map((collection) => {
                      return (
                        <>
                          <div style={{ float: "none", width: "100%" }}>
                            <div>
                              <h1 className={styles.collectionName}>
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
                                  key={Math.random() * 1000000000000000}
                                  className={`${styles.card} ${styles.nftCard}`}>
                                  <h2>
                                    {nft_metadata
                                      ? nft_metadata.name
                                        ? nft_metadata.name
                                        : `${nft.name} ${nft.token_id}`
                                      : `${nft.name} ${nft.token_id}`}
                                  </h2>
                                  <img
                                    src={`${nft_metadata ? nft_metadata.image : nft.image}`}
                                    alt={
                                      nft_metadata
                                        ? nft_metadata.name
                                          ? nft_metadata.name
                                          : `${nft.name} ${nft.token_id}`
                                        : `${nft.name} ${nft.token_id}`
                                    }
                                  />
                                  <h4 className={styles.nftBuyPriceTitle}>Buy Price:</h4>
                                  <h4 className={styles.nftBuyPriceValue}>
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
                zIndex: "3",
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
                  width: "95%",
                  height: "95%",
                  padding: "0rem 0rem 2rem 0rem",
                  backgroundColor: "white",
                  border: "1px solid #dedede",
                  borderRadius: "20px",
                }}>
                <div style={{ width: "90%", height: "85%" }}>
                  <h1 className={styles.bigGraphCollectionName}>{currentCollection} Avg. Buy price</h1>
                  <button
                    onClick={() => {
                      setExpandGraph(false);
                      // getAvgBuyPrice(currentCollectionAddress, currentCollection);
                    }}
                    className={`${styles.minimizeBtn} ${styles.btnBig}`}>
                    <MinimizeIcon style={{ width: "14px", height: "14px" }}></MinimizeIcon>
                    Minimize
                  </button>
                  <Chart
                    className={styles.bigGraph}
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
            <div style={{ zIndex: "3" }} className={styles.smallGraphWrapper}>
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
          <div className={styles.accountWrapper}>
            <h1 className={styles.nft_tracker_title}>NFT Tracker</h1>
            <div className={styles.accountInfoWrapper}>
              <input
                id="emailInput"
                className={styles.accountInfoInput}
                type="email"
                placeholder="Enter Your Email"
              />
              <input
                id="passwordInput"
                className={styles.accountInfoInput}
                type="password"
                placeholder="Enter Your Password"
              />
              <button
                onClick={async () => {
                  if (emailInput.value && passwordInput.value) {
                    if (hasAccount == true) {
                      await login(emailInput.value, passwordInput.value);
                    } else {
                      await signUp(emailInput.value, passwordInput.value);
                    }
                  } else {
                    window.alert("Please fill out the fields");
                  }
                }}
                className={`${styles.submitBtn} ${styles.btnBig}`}>
                {hasAccount ? "Log In" : "Create Account"}
              </button>
            </div>
            <h4>
              {hasAccount ? "Dont have an account? click" : "Already have an account? click"}
              <button
                className={styles.logInSignUpBtn}
                onClick={() => {
                  hasAccount ? setHasAccount(false) : setHasAccount(true);
                }}>
                here
              </button>
            </h4>
          </div>
        </div>
      )}
      {loggedIn && !collapseSideBar ? (
        <>
          <div style={{ zIndex: "3" }} className={styles.sidebarWrapper}>
            <div className={styles.accountsTitleWrapper}>
              <h1 className={styles.accountsTitle}>Accounts</h1>
              <button
                style={{ border: "none", backgroundColor: "rgba(255, 255, 255, 0)" }}
                onClick={() => {
                  if (address) {
                    setCollapseSideBar(true);
                  } else {
                    window.alert("Please select an address");
                  }
                }}>
                <CollapseSidebarArrowIcon></CollapseSidebarArrowIcon>
              </button>
            </div>
            <div className={styles.addAddressWrapper}>
              <button
                onClick={() => {
                  setAddingAddress(true);
                }}
                className={styles.addAddressBtn}>
                Add Address
              </button>
              <PlusIcon></PlusIcon>
            </div>
            {addressList.map((addresses) => {
              return (
                <div key={Math.random() * 1000000000000000} className={styles.addAddressWrapper}>
                  <button
                    style={{
                      textOverflow: "ellipsis",
                      width: "inherit",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => {
                      setAddress(addresses);
                      setUpdates(true);
                    }}
                    className={styles.addAddressBtn}>
                    {addresses}
                  </button>
                </div>
              );
            })}
            <div className={styles.addressListWrapper}></div>
            <div className={styles.userBalanceSidebar}>
              <h1 style={{ fontFamily: "playfair display", fontWeight: 900, fontSize: "30px" }}>
                Account Balance
              </h1>
              <h4 style={{ fontFamily: "roboto slab", fontWeight: 200 }}>
                {balance} <b style={{ fontFamily: "playfair display", fontWeight: 900 }}>ETH</b>
              </h4>
              <h4 style={{ fontFamily: "roboto slab", fontWeight: 200 }}>
                {balanceUSD} <b style={{ fontFamily: "playfair display", fontWeight: 900 }}>USD</b>
              </h4>
            </div>
            <button
              style={{
                position: "absolute",
                bottom: "0px",
                margin: "20px",
              }}
              onClick={() => {
                window.sessionStorage.clear();
                window.location.reload();
              }}
              className={styles.addAddressBtn}>
              Log Out
            </button>
          </div>
          {accountData.data.allAccounts.nodes[0].addresses == null || addingAddress ? (
            <div
              style={{ zIndex: "3", position: "absolute", top: "0", width: "100%" }}
              className={styles.container}>
              <div className={styles.addressWrapper}>
                <input
                  id="walletAddrInput"
                  className={styles.addrInfoInput}
                  type="text"
                  placeholder="Enter Your Wallet Address"
                />
                <button
                  onClick={async () => {
                    if (walletAddrInput.value) {
                      if (web3.utils.isAddress(walletAddrInput.value)) {
                        addAddress(walletAddrInput.value);
                        if (accountData.data.allAccounts.nodes[0].addresses == null) {
                          setAddressList([walletAddrInput.value]);
                        } else {
                          await findAccount(
                            accountData.data.allAccounts.nodes[0].email,
                            accountData.data.allAccounts.nodes[0].password
                          );
                          setAddressList(accountData.data.allAccounts.nodes[0].addresses[0].split(","));
                        }
                        walletAddrInput.value = "";
                      } else {
                        window.alert("This Address is not valid");
                      }
                    } else {
                      window.alert("Please fill out the fields");
                    }
                  }}
                  className={`${styles.submitBtn} ${styles.btnBig}`}>
                  Add Address
                </button>
                <button
                  onClick={() => {
                    setAddingAddress(false);
                  }}
                  className={` ${styles.btnBig} ${styles.closeBtn}`}>
                  X
                </button>
              </div>
            </div>
          ) : null}
          {!address ? (
            <div
              style={{
                position: "absolute",
                top: "0",
                backgroundColor: "rgba(255, 255, 255, 1)",
                width: "100%",
                height: "100%",
                zIndex: "2",
              }}></div>
          ) : null}
        </>
      ) : null}
      {collapseSideBar ? (
        <button
          style={{
            border: "none",
            backgroundColor: "rgba(255, 255, 255, 0)",
            zIndex: "9999",
            position: "absolute",
            top: "10px",
            left: "5px",
            transform: "scaleX(-1)",
          }}
          onClick={() => {
            setCollapseSideBar(false);
          }}>
          <CollapseSidebarArrowIcon></CollapseSidebarArrowIcon>
        </button>
      ) : null}
    </>
  );
}
