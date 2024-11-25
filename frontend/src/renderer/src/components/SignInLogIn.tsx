import React, { useState }from 'react';
import { useNavigate } from 'react-router-dom';
import WalrusCoinLogo from '../assets/walrus-coin-icon.png';
import { electronAPI } from '@electron-toolkit/preload';
import { ipcRenderer } from 'electron';
import path from 'path';
import axios from 'axios';
import { LoadingButton } from '@mui/lab';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function SignInLogIn(): JSX.Element {

  // const [inputValue, setInputValue] = useState('');
  // const [inputValue2, setInputValue2] = useState('');
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);
  const [newLoading, setNewLoading] = useState(false);
  const [existingLoading, setExistingLoading] = useState(false);

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setInputValue(e.target.value);
  // }

  // const handleInputChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setInputValue2(e.target.value);
  // }
  // const client = new JsonRpcClient({
    // endpoint: 'http://localhost:8332/rpc',
  // });

  // const startBtcd = async () => {
  //   await fetch('http://localhost:3001/start-process', {
  //     method: 'POST',
  //   });
  // };
  // }

  // const startBtcd = async () => {
  //   await fetch('http://localhost:3001/start-btcd', {
  //     method: 'POST',
  //   });
  // };

  const handleLogin = async () => {
    setExistingLoading(true);
    try {
      // start wallet (ADD: check for error)
      // const res = await window.versions.startProcess("../backend/btcwallet/btcwallet", ['-C', '../backend/btcwallet.conf']);
      const res = await window.versions.startWallet();
      // const btcd = await startBtcd();
      // const startBtcd = async () => {
      //   await fetch('http://localhost:3001/start-btcd', {
      //   method: 'POST',
      // });
      // };
      // const res2 = await window.versions.getAddress("../backend/btcd/btcd", ['-C', '../backend/btcd.conf', '--notls']);

      // console.log(res2);
      console.log("started btcd and btcwallet");
      // res.kill();
      // console.log(res);
      // await sleep(5000);
      const address_res = await window.versions.getAddress();
      console.log("returned from res");

      // const address = await window.versions.getItem("walletaddr");
      // console.log("ADDRESS: " + address);

      // res.kill();
      // get wallet address
      // const resrpc = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "getaccountaddress", params: ["default"]}, {
      //   auth: {
      //     username: 'user',
      //     password: 'password'
      //   },
      //   headers: {
      //     'Content-Type': 'text/plain;',
      //   },
      // });
      // let walletaddr = resrpc.data.result;
      // console.log(walletaddr);
      localStorage.setItem("walletaddr", address_res);
      // await sleep(2000);
      // start btcd
      console.log("STARTING BTCD AGAIN IN SIGN IN");
      const btcdres = await window.versions.startProcess('../backend/btcd/btcd', ['-C', '../backend/btcd.conf', '--notls', , '--txindex', '--addrindex', '--miningaddr', address_res]);

      // wait for btcwallet to start (maybe add loading symbol of some sort?)
      console.log(btcdres);
      // await sleep(1000);

      const passres = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "walletpassphrase", params: ["password", 99999999]}, {
        auth: {
          username: 'user',
          password: 'password'
        },
        headers: {
          'Content-Type': 'text/plain;',
        },
      });
      console.log("passphrase: " + passres);
      // test rpc call
      // const resrpc = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "listaccounts", params: []}, {
      //   auth: {
      //     username: 'user',
      //     password: 'password'
      //   },
      //   headers: {
      //     'Content-Type': 'text/plain;',
      //   },
      // });

      // console.log(resrpc);
      navigate('/status');
    }
    catch (error) {
      setHasError(true);
      setExistingLoading(false);
      console.log(error);
    }
  };

  const closeErrorMessage = () => {
    setHasError(false);
  };

  const handleRegister = async () => {
    setNewLoading(true);
    navigate('/register'); // register conditions
  };

  return (
      <div style={{ backgroundColor: '#997777' }} className="container flex justify-center items-center h-screen w-screen">
          <div className="flex flex-col items-center">
              <img src={WalrusCoinLogo} alt="WalrusCoin" className="w-80 h-80" />
              <div className="flex justify-center p-4">
                  <span className="text-white text-5xl">{"WalrusCoin"}</span>
              </div>
              <div className="header">
              </div>
              <div className="inputs mt-4">
                <div className="submit-container flex h-12 space-x-10">
                  <div className="submit-container flex">
                    <LoadingButton
                      loading={newLoading}
                      onClick={handleRegister}
                      variant="contained"
                      loadingPosition='end'
                      disabled={existingLoading}
                      endIcon={null}
                      sx={{
                        textTransform: 'none', 
                        backgroundColor: '#78350f',  // bg-yellow-900
                        padding: '0px 40px'
                      }}
                      className="bg-yellow-900 text-white rounded over:bg-black disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Create New Wallet
                    </LoadingButton>
                  </div>
                  <div className="submit-container flex">
                    <LoadingButton
                      loading={existingLoading}
                      onClick={handleLogin}
                      variant="contained"
                      disabled={existingLoading}
                      loadingPosition='end'
                      endIcon={null}
                      sx={{
                        textTransform: 'none', 
                        backgroundColor: '#78350f',  // bg-yellow-900
                        padding: '0px 40px'
                      }}
                      className="bg-yellow-900 text-white rounded over:bg-black disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Use Existing Wallet
                    </LoadingButton>
                  </div>
                </div>
              </div>
              <div>
                {hasError && (
                  <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-200 text-red-600 p-2 rounded flex items-start">
                    <span>Oops! We couldn't find your wallet. Please create a new wallet.</span>
                    <button onClick={closeErrorMessage} className="ml-2 text-gray-500 font-bold">x</button>
                  </div>
                )}
              </div>
          </div>
      </div>
  );
}

export default SignInLogIn;
