import React, { useState, useEffect, useRef }from 'react';
import { useNavigate } from 'react-router-dom';
import WalrusCoinLogo from '../assets/walrus-coin-icon.png';
import { electronAPI } from '@electron-toolkit/preload';
import { ipcRenderer } from 'electron';
import path from 'path';
import axios from 'axios';
import { LoadingButton } from '@mui/lab';
import fs from 'fs';
import os from 'os';
// const os = require('os');
// const fs = require('fs');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getAppDataPath(appName) {
  const platform = os.platform();
  let appDataPath;

  if (platform === 'win32') {
    appDataPath = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  } else if (platform === 'darwin') {
    appDataPath = path.join(os.homedir(), 'Library', 'Application Support');
  } else if (platform === 'linux') {
    appDataPath = path.join(os.homedir(), '.local', 'share');
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  return path.join(appDataPath, appName || '');
}

function LoginPage(): JSX.Element {
  const [error_message, set_error_message] = useState('');
  const [walletPassword, setWalletPassword] = useState('');
  const [walletExists, setWalletExists] = useState(()=> localStorage.getItem("walletExists") == "true");
  const [startNet, setStartNet] = useState(false);
  const [existingLoading, setExistingLoading] = useState(false);;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const [inputValue, setInputValue] = useState('');
  // const [inputValue2, setInputValue2] = useState('');
  const navigate = useNavigate();

  const hiddenFileInput = useRef(null)

  const handleClick = () => {
    if (hiddenFileInput.current) (hiddenFileInput.current as HTMLInputElement).click()
  }

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0])
  }

  useEffect(() => {
    const loadFile = async (selectedFile) => {
      console.log("SELECTEDFILE PATH: " + selectedFile);
      const loadWallet = await window.versions.loadWalletFile(selectedFile);
      navigate('/sign-in');
      // let appdatapath = getAppDataPath("Btcwallet") + "/mainnet/";
      // fs.copyFile(selectedFile.path, appdatapath, (copyErr) => {
      //   console.error("ERROR copying file:", copyErr);
      //   return;
      // });
    }
    if (selectedFile) {
      console.log("SELECTEDFILE PATH: " + selectedFile.path);
      loadFile(selectedFile.path);
      // let appdatapath = getAppDataPath("Btcwallet") + "/mainnet/";
      // fs.copyFile(selectedFile.path, appdatapath, (copyErr) => {
      //   console.error("ERROR copying file:", copyErr);
      //   return;
      // });
      
      // const loadWallet = await window.versions.loadWalletFile(selectedFile);
    }
  }, [selectedFile])

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setInputValue(e.target.value);
  // }

  // const handleInputChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setInputValue2(e.target.value);
  // }
  // const client = new JsonRpcClient({
    // endpoint: 'http://localhost:8332/rpc',
  // });
  const goToSignIn = async () => {
    await window.versions.killWallet();
    navigate('/sign-in');
  }

  const handleLogin = async () => {
    setExistingLoading(true);

    // if (localStorage.getItem("startnet") == 'true') {
    //   console.log("IN STARTNEXT TRUE");
    //   if (walletPassword == '') {
    //     setExistingLoading(false);
    //     set_error_message("The password cannot be blank.");
    //     return;
    //   }

    //   const passres = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "walletpassphrase", params: [walletPassword, 99999999]}, {
    //       auth: {
    //         username: 'user',
    //         password: 'password'
    //       },
    //       headers: {
    //         'Content-Type': 'text/plain;',
    //       },
    //     } as any
    //   );
        
    //     console.log(passres);
    //     // error check password
    //     console.log(passres.data.error);
    //     if (passres.data.error != null) {
    //       setExistingLoading(false);
    //       set_error_message("Incorrect password, please try again.");
    //       setWalletPassword('');
    //       return;
    //     }

    //     navigate('/status');
    // } 
    if(walletPassword != '') {
      
        // start wallet (ADD: check for error)
        // const res = await window.versions.startProcess("../backend/btcwallet/btcwallet", []);

        // console.log(res);
        // console.log("started btcwallet");

        // wait for btcwallet to start (maybe add loading symbol of some sort?)
        // await sleep(1000);
        // console.log("started btcwallet");
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
        set_error_message('Verifying Password...');
        const passres = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "walletpassphrase", params: [walletPassword, 99999999]}, {
          auth: {
            username: 'user',
            password: 'password'
          },
          headers: {
            'Content-Type': 'text/plain;',
          },
        });

        if (passres.data.error != null) {
          setExistingLoading(false);
          set_error_message("Incorrect password, please try again.");
          setWalletPassword('');
          const kill_wallet = await window.versions.killWallet();
          return;
        }
        set_error_message('Getting Address...');
        const address_res = await window.versions.getAddress();

        localStorage.setItem("walletaddr", address_res);
        
        // const btcdres = await window.versions.startProcess('../backend/btcd/btcd', ['-C', '../backend/btcd.conf', '--notls', '--txindex', '--addrindex', '--miningaddr', address_res]);
        set_error_message('Starting BTCD...');
        const btcdres = await window.versions.startBtcd(address_res);
        set_error_message('Connecting to Network...');
        const connect_network = await window.versions.connectNet();

        const kill_wallet = await window.versions.killWallet();
        set_error_message('Starting Wallet...');
        const start_wallet = await window.versions.startWallet();


        // localStorage.setItem("startnet", "true");
        setStartNet(true);

        // const passres = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "walletpassphrase", params: [walletPassword, 99999999]}, {
        //   auth: {
        //     username: 'user',
        //     password: 'password'
        //   },
        //   headers: {
        //     'Content-Type': 'text/plain;',
        //   },
        // });

        localStorage.setItem("walletpassword", walletPassword);
        
        console.log(passres);
        // error check password
        console.log(passres.data.error);
        // if (passres.data.error != null) {
        //   setExistingLoading(false);
        //   set_error_message("Incorrect password, please try again.");
        //   setWalletPassword('');
        //   return;
        // }
        set_error_message('Adding Bootstrap...');
        const add_bootstrap = await window.versions.addBootstrap();
        navigate('/status');
    } else {
      setExistingLoading(false);
      set_error_message("The password cannot be blank.");
    }
  };

  // useEffect(() => {
  //   const checkIfWalletExists = async () => {
  //     try {

  //       let log =  await window.versions.startProcess("../backend/btcwallet/btcwallet", []);
  //       console.log(log)
  //       setWalletExists(true)

  //     } catch (error) {
  //       console.log(error)
  //       setWalletExists(false)
  //     }
  //   };
  //   checkIfWalletExists();
  // }, []);

  if(walletExists) {
    return (
        <div style={{ backgroundColor: '#997777' }} className="container flex justify-center items-center h-screen w-screen">
        <div className="flex flex-col items-center">
          <div className="header">
              <div className="text-xl text-white"> Please enter your password: </div>
          </div>
          <div className="inputs mt-4">
            <div className="input mb-4 flex space-x-2">
                <input 
                    type="password" 
                    placeholder='Password' 
                    className="border border-gray-300 p-2 rounded focus:outline-none"
                    onChange={(event)=>{setWalletPassword(event.target.value)}}
                    required
                    />
                    <div className="register-container flex justify-end w-full">
                <div className="submit-container flex">
                  {/* <button 
                      className="submit bg-yellow-900 text-white px-4 py-2 rounded hover:bg-black duration-300 disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                      type='button'
                      onClick={() => handleLogin()}
                      // disabled={!inputValue}
                      >
                        Login
                  </button> */}
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
                      Login
                    </LoadingButton>
                    </div>
                </div>
              </div>
            </div>
          </div>
          <div className='text-white'>{error_message}</div>
          <div className='flex space-x-1'>
            <div>Not sure yet?</div>
            <div className='cursor-pointer text-blue-800 underline'
              onClick={()=>{!existingLoading && goToSignIn()}}
              >
              Return to home</div>
          </div>
        </div>
    </div>
    );
  }
  else {
    return (
        <div style={{ backgroundColor: '#997777' }} className="container flex justify-center items-center h-screen w-screen">
            <div className="flex flex-col items-center">
                <div className="header">
                    <div className="text-white"> You don't have a wallet! </div>
                </div>
                <div className="inputs mt-4">
                    <div className="submit-container flex">
                        <div className="register-container flex justify-end w-full">
                        <input type="file" onChange={handleFileChange} ref={hiddenFileInput} style={{ display: 'none' }} />
                            <button 
                                className="submit bg-yellow-900 text-white px-4 py-2 rounded hover:bg-black duration-300 disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                                type='button'
                                onClick={() => navigate('/register')}
                                >
                                Generate a New Wallet
                            </button>
                            <button 
                                className="submit bg-yellow-900 text-white px-4 py-2 rounded hover:bg-black duration-300 disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                                type='button'
                                onClick={handleClick}
                                >
                                Upload Existing Wallet File
                            </button>
                        </div>
                    </div>
                </div>
                <div className='flex space-x-1 mt-4'>
                    <div>Not sure yet?</div><div onClick={goToSignIn} className='cursor-pointer text-blue-800 underline'>Return to home</div>
                </div>
            </div>
        </div>
    );
  }


}

export default LoginPage;