import React, { useState }from 'react';
import { useNavigate } from 'react-router-dom';
import WalrusCoinLogo from '../assets/walrus-coin-icon.png';
import { electronAPI } from '@electron-toolkit/preload';
import { ipcRenderer } from 'electron';
import path from 'path';
import axios from 'axios';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function SignInLogIn(): JSX.Element {

  // const [inputValue, setInputValue] = useState('');
  // const [inputValue2, setInputValue2] = useState('');
  const navigate = useNavigate();

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
    // start wallet (ADD: check for error)
    const res = await window.versions.startProcess("../backend/btcwallet/btcwallet", ['-C', '../backend/btcwallet.conf']);
    // const btcd = await startBtcd();
    // const startBtcd = async () => {
    //   await fetch('http://localhost:3001/start-btcd', {
    //   method: 'POST',
    // });
    // };
    
    const res2 = await window.versions.getAddress("../backend/btcd/btcd", ['-C', '../backend/btcd.conf', '--notls']);

    console.log(res2);
    console.log("started btcd and btcwallet");
    // res.kill();
    console.log(res);
    await sleep(5000);
    const address = await window.versions.getItem("walletaddr");
    console.log("ADDRESS: " + address);
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
    localStorage.setItem("walletaddr", address);
    await sleep(2000);
    // start btcd
    const btcdres = await window.versions.startProcess('../backend/btcd/btcd', ['-C', '../backend/btcd.conf', '--notls', '--miningaddr', address]);

    // wait for btcwallet to start (maybe add loading symbol of some sort?)
    console.log(btcdres);
    await sleep(1000);
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
  };

  const handleRegister = async () => {
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
                  <div className="submit-container flex">
                    <div className="register-container">
                        <button 
                            className="submit bg-yellow-900 text-white p-2 rounded hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                            type='button'
                            onClick={handleRegister}
                          >
                            Create New Wallet
                        </button>
                    </div>
                    <div className="submit-container flex">
                        <button 
                          className="submit bg-yellow-900 text-white p-2 rounded hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                          type='button'
                          onClick={handleLogin}
                        >
                          Use Existing Wallet
                        </button>
                    </div>
                  </div>
              </div>
          </div>
      </div>
  );
}

export default SignInLogIn;
