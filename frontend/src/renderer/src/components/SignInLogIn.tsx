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
  const [hasError, setHasError] = useState(false)

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setInputValue(e.target.value);
  // }

  // const handleInputChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setInputValue2(e.target.value);
  // }
  // const client = new JsonRpcClient({
    // endpoint: 'http://localhost:8332/rpc',
  // });

  const handleLogin = async () => {
    try {
      // start wallet (ADD: check for error)
      const res = await window.versions.startProcess("../backend/btcwallet/btcwallet", ['-C', '../backend/btcwallet.conf']);
      
      console.log(res);

      // wait for btcwallet to start (maybe add loading symbol of some sort?)
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
    }
    catch (error) {
      setHasError(true);
      console.log(error);
    }
  };

  const closeErrorMessage = () => {
    setHasError(false);
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
