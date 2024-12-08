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

function SendPage(): JSX.Element {

  // const [inputValue, setInputValue] = useState('');
  // const [inputValue2, setInputValue2] = useState('');
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);
  const [newLoading, setNewLoading] = useState(false);
  const [existingLoading, setExistingLoading] = useState(false);
  const [amount, setAmount] = useState<number | undefined>(undefined);

  const [destAddress, setDestAddress] = useState("");
  // const [walletExists, setWalletExists] = useState(false);
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

  const handleSend = async () => {
    setExistingLoading(true);
    try {
      // const res = await window.versions.startWallet();

      // const address_res = await window.versions.getAddress();

      // localStorage.setItem("walletaddr", address_res);
      
      // const btcdres = await window.versions.startProcess('../backend/btcd/btcd', ['-C', '../backend/btcd.conf', '--notls', , '--txindex', '--addrindex', '--miningaddr', address_res]);
      console.log("sending coin");
      console.log(destAddress);
      console.log(amount);
      const sendres = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "sendtoaddress", params: [destAddress, amount]}, {
        auth: {
          username: 'user',
          password: 'password'
        },
        headers: {
          'Content-Type': 'text/plain;',
        },
      });
      console.log(sendres);
      const ret = await window.versions.killWallet();
      const ret2 = await window.versions.startWallet();
      console.log("killed wallet"); 
      navigate('/transactions');
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
                    <div className="input mb-4">
                      <input 
                          type="number" 
                          placeholder='WACO Amount'
                          className="border border-gray-300 p-2 rounded focus:outline-none"
                          value={amount || ''}
                          onChange={(event)=>{setAmount(event.target.value ? Number(event.target.value): undefined)}}
                        />
                    </div>
                    <div className="input mb-4">
                      <input 
                          type="text" 
                          placeholder='Destination Address' 
                          className="border border-gray-300 p-2 rounded focus:outline-none"
                          value={destAddress}
                          onChange={(event)=>{setDestAddress(event.target.value)}}
                        />
                    </div>
                  </div>
                  <div className="submit-container flex">
                    <LoadingButton
                      loading={existingLoading}
                      onClick={handleSend}
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
                      Send Coin
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

export default SendPage;
