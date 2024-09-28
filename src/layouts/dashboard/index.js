// @mui material components
import React, { useEffect, useState } from "react";
import { sprintf } from "sprintf-js";

import Grid from "@mui/material/Grid";

// Material Dashboard 2 React components
import MDBox from "../../components/MDBox";
import MDSnackbar from "../../components/MDSnackbar";
import Tables from "../../layouts/tables";

// Material Dashboard 2 React components
import DashboardLayout from "../../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../examples/Navbars/DashboardNavbar";
import ComplexStatisticsCard from "../../examples/Cards/StatisticsCards/ComplexStatisticsCard";
import ComplexStatisticsCardOne from "../../examples/Cards/StatisticsCards/ComplexStatisticsCard/complex";

// Data
import getWallet from "../../fetchData/walletlist";
import getTokenInfo from "../../fetchData/TokenInfo";
import CheckFilter from "../../fetchData/checkFilter";

// Constants
import * as Status from "../../config/constants";
import * as Config from "../../config/config";
import * as Message from "../../config/message";

function Dashboard() {
  const autoModeStorage = localStorage.getItem(Config.STORAGE_VAR_AUTO_MODE);
  const localSetting = localStorage.getItem(Config.STORAGE_VAR_SETTING);
  const localStorageSetting = localSetting
    ? JSON.parse(localSetting)
    : { premined: [0, 100], amm: [0, 100], locked: [0, 100], mint: "", burned: "", sol: 50 };

  const [elapsedTime, setElapsedTime] = useState(0);
  const [newTokenList, setNewTokenList] = useState([]);
  const [tokenHolderList, setTokenHolderList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prePct, setPrePct] = useState(0);
  const [notificationText, setNotificationText] = useState("");
  const [notificationStatus, setNotificationStatus] = useState(false);
  const [action, setAction] = useState(true);
  const [prevStatus, setPrevStatus] = useState(Status.NONE);
  const [currentStatus, setCurrentStatus] = useState(Status.NONE);
  const [filter, setFilter] = useState(localStorageSetting);
  const [startCheck, setStartCheck] = useState(false);
  const [newTokenAddrss, setNewTokenAddress] = useState("");
  const [filteringTokenAddress, setTokenAddressForFilter] = useState("");
  const [autoMode, setAutoMode] = useState(
    autoModeStorage === Config.STORAGE_VAR_AUTO_MODE_YES ? true : false
  );
  const [tokenInfo, setTokenInfo] = useState({
    symbol: "",
    total: 0,
    decimal: 0,
    liquidity: { lpLocked: 0, tokenSupply: 100 },
    amm: 0,
    mintAuthority: null,
    freezeAuthority: null,
    sol: 0,
  });

  const initInterface = () => {
    setTokenAddressForFilter("");
    setLoading(false);
    setTokenHolderList([]);
    setPrePct(0);
    setTokenInfo({
      symbol: "",
      total: 0,
      decimal: 0,
      liquidity: { lpLocked: 0, tokenSupply: 100 },
      amm: 0,
      mintAuthority: null,
      freezeAuthority: null,
      sol: 0,
    });
  };

  const initDashboard = () => {
    initInterface();
    setPrevStatus(Status.NONE);
    setCurrentStatus(Status.NONE);
  };

  const startAutoMode = () => {
    setNewTokenList([]);
    setTokenAddressForFilter("");
    setAutoMode(true);
    setCurrentStatus(Status.STARTING);
    setAction(false);
  };

  const refresh = () => {
    window.location.reload();
  };

  const startManualMode = () => {
    setAutoMode(false);
    extract(filteringTokenAddress);
  };

  const autoStart = () => {
    console.error("Auto Started!");
    localStorage.setItem(Config.STORAGE_VAR_AUTO_MODE, Config.STORAGE_VAR_AUTO_MODE_NO);
    startAutoMode();
  };

  const refreshAndAutoStart = () => {
    setElapsedTime(0);
    localStorage.setItem(Config.STORAGE_VAR_AUTO_MODE, Config.STORAGE_VAR_AUTO_MODE_YES);
    refresh();
  };

  const initElapsedTime = () => {
    setElapsedTime(0);
    localStorage.setItem(Config.STORAGE_VAR_AUTO_MODE, Config.STORAGE_VAR_AUTO_MODE_NO);
  };

  const makeElaspedTime = () => {
    let min = elapsedTime / 60,
      sec = elapsedTime % 60;
    const time = sprintf("Elapsed Time: %02d:%02d", min, sec);
    console.error(time);
  };

  const fetchNewToken = async () => {
    const token = await fetch(Config.NEW_TOKEN_URL).then((res) => res.json());
    setNewTokenAddress(token.address);
    console.error(token.address);
  };

  const changeWallets = (nonBuyOwners, pct) => {
    setPrePct((before) => pct);
    setTokenHolderList((beforeState) => [...nonBuyOwners]);
    setLoading(false);
  };

  const closeNotification = () => {
    setNotificationStatus(false);
  };

  const extract = (tokenAddress) => {
    console.error("Extract function called!");
    console.error("Token Length: " + tokenAddress.length);

    if (tokenAddress.length == 44 || tokenAddress.length == 43) {
      setNewTokenAddress(tokenAddress);
      if (!autoMode) {
        setPrevStatus(currentStatus);
        setCurrentStatus(Status.STARTED);
      }
      setStartCheck(false);
      setLoading(true);
      getTokenInfo({
        tokenAddress: tokenAddress,
        setNotificationText: setNotificationText,
        setNotificationStatus: setNotificationStatus,
        setStatus: setCurrentStatus,
        setTokenInfo: (tokenInfo) => setTokenInfo(tokenInfo),
      });
    }
  };

  useEffect(() => {
    if (autoMode) {
      if (autoModeStorage == Config.STORAGE_VAR_AUTO_MODE_YES) {
        autoStart();
      }

      const intervalId = setInterval(() => {
        setElapsedTime((prevElapsedTime) => prevElapsedTime + 1);
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [autoMode]);

  useEffect(() => {
    if (elapsedTime > Config.EXCEED_TIME) {
      refreshAndAutoStart();
    }
  }, [elapsedTime]);

  useEffect(() => {
    if (newTokenAddrss != "") {
      // Check if the new token already exists in the list
      const exists = newTokenList.some((address, index) => address === newTokenAddrss);
      if (!exists) setNewTokenList((prevList) => [...prevList, newTokenAddrss]);
      setNewTokenAddress("");
      if (currentStatus == Status.GET_NEWTOKEN) {
        // If it is here for getting next token address, change the status from GET_NEW_TOKEN to STARTING
        setCurrentStatus(Status.STARTING);
      }
    }
  }, [newTokenAddrss]);

  useEffect(() => {
    if (!action) {
      const interval = setInterval(() => fetchNewToken(), 3000);
      return () => clearInterval(interval);
    }
  }, [action]);

  useEffect(() => {
    if (startCheck) {
      setCurrentStatus(CheckFilter(tokenInfo, prePct, filter));
    }
  }, [startCheck]);

  useEffect(() => {
    if (currentStatus == Status.FINISHED) {
      if (autoMode) {
        setNotificationText(Message.FINISHED_FILTERING);
        setNotificationStatus(true);
        setAutoMode(false);
        setAction(true);
      }
      setPrevStatus(currentStatus);
      setCurrentStatus(Status.NONE);
    } else if (currentStatus == Status.PAUSING) {
      initDashboard();
      setPrevStatus(currentStatus);
      setCurrentStatus(Status.PAUSED);
    } else if (currentStatus == Status.STARTING_NEXT) {
      setPrevStatus(currentStatus);
      setCurrentStatus(Status.STARTING);
    } else if (currentStatus == Status.STOPPING) {
      setPrevStatus(currentStatus);
      setCurrentStatus(Status.STOPPED);
    } else if (currentStatus == Status.GOT_TOKENINFO) {
      setCurrentStatus(Status.STARTED);
      getWallet({
        tokenAddress: filteringTokenAddress,
        autoMode: autoMode,
        currentStatus: currentStatus,
        tokenInfo: tokenInfo,
        func: changeWallets,
        setStartCheck: setStartCheck,
        setNotificationText: setNotificationText,
        setNotificationStatus: setNotificationStatus,
        setCurrentStatus: setCurrentStatus,
      });
    }

    initElapsedTime();
  }, [currentStatus]);

  useEffect(() => {
    if (prevStatus == Status.STOPPING && currentStatus == Status.STOPPED && autoMode) {
      setNotificationText(Message.SEARCHING_NEXTTOKEN);
      setNotificationStatus(true);
      setCurrentStatus(Status.STARTING_NEXT);
      initInterface();
    } else if (prevStatus == Status.STOPPING && currentStatus == Status.STOPPED && !autoMode) {
      setNotificationText(Message.FILTERING_ERROR);
      setNotificationStatus(true);
      setCurrentStatus(Status.FINISHED);
    }
  }, [prevStatus]);

  useEffect(() => {
    if (action) {
      setTokenHolderList(tokenHolderList.filter((item) => item.STATUS != -1));
    }
  }, [action]);

  useEffect(() => {
    if (newTokenList.length > 0) {
      const token = newTokenList[newTokenList.length - 1];
      const filteredTokens = newTokenList.filter((item, index) => item != token);
      if (autoMode && currentStatus == Status.STARTING) {
        console.error(newTokenList);
        console.error(
          `NewToken: ${newTokenAddrss}, token: ${token}, filteringToken: ${filteringTokenAddress}`
        );
        if (newTokenAddrss == "" && token != filteringTokenAddress) {
          console.error("Current Status: " + currentStatus);
          initDashboard();
          setCurrentStatus(Status.STARTED);
          setNewTokenAddress(token);
          setTokenAddressForFilter(token);
          extract(token);
          setNewTokenList(filteredTokens);
        }
      }
    } else if (currentStatus == Status.STARTING && prevStatus != Status.NONE && autoMode) {
      fetchNewToken(); // get new token address in case of that there is no next token address to filter
      setNotificationText(Message.FILTERING_NEWTOKEN);
      setNotificationStatus(true);
      setCurrentStatus(Status.GET_NEWTOKEN);
    }
  }, [autoMode, newTokenList, currentStatus]);

  const liquidityLockPercent = tokenInfo.liquidity.lpLockedPct;
  return (
    <DashboardLayout>
      <DashboardNavbar
        callback={extract}
        setFilter={setFilter}
        action={action}
        setAction={setAction}
        status={currentStatus}
        setStatus={setCurrentStatus}
        setAutoMode={setAutoMode}
        setNewTokenList={setNewTokenList}
        symbol={tokenInfo.symbol}
        contractAdd={filteringTokenAddress}
        setContractAdd={setTokenAddressForFilter}
      />
      <MDBox py={5}>
        <Grid container spacing={6} pr={12} pl={12} pt={10}>
          <Grid item xs={24} md={12} lg={6}>
            <MDBox>
              <ComplexStatisticsCard
                color="error"
                icon="paypal"
                title="TOTAL"
                count="34k"
                percentage={{
                  color: "success",
                  amount:
                    tokenInfo != {} ? (tokenInfo.total / 10 ** tokenInfo.decimal).toFixed() : 0,
                  amount1: tokenInfo.sol,
                  label: "Token supply",
                  label1: "POOLED SOL",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={24} md={12} lg={6}>
            <MDBox>
              <ComplexStatisticsCard
                color="success"
                icon="percent"
                title="Pre-mined and Amm Percentage"
                count="34k"
                percentage={{
                  color: "success",
                  amount: prePct,
                  amount1: tokenInfo != {} ? tokenInfo.amm : 0,
                  label: "Premined PCT(%)",
                  label1: "AMM PCT(%)",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={24} md={12} lg={6}>
            <MDBox>
              <ComplexStatisticsCardOne
                color="primary"
                icon="weekend"
                title="Mint Authority Revoked"
                count={281}
                percentage={{
                  color: "success",
                  amount: tokenInfo.mintAuthority === null ? "No" : "Yes",
                  label: "Revoked",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={24} md={12} lg={6}>
            <MDBox>
              <ComplexStatisticsCard
                color="secondary"
                icon="leaderboard"
                title="Liquidity"
                count="2,300"
                percentage={{
                  color: "success",
                  amount: liquidityLockPercent ? liquidityLockPercent.toFixed(2) : 0,
                  amount1: tokenInfo.freezeAuthority === null ? "No" : "Yes",
                  label: "LockedPct(%)",
                  label1: "Burned",
                }}
              />
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>
      <MDBox>
        <Grid container pr={12} pl={12}>
          <Grid item xs={12} md={12} lg={12}>
            <MDBox mb={1}>
              <MDSnackbar
                color="success"
                icon="check"
                title="Check Result"
                content={notificationText}
                dateTime="now"
                open={notificationStatus}
                onClose={closeNotification}
                close={closeNotification}
                bgWhite
              />
              <Tables tokenHolderList={tokenHolderList} total={tokenInfo} loading={loading} />
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default Dashboard;
