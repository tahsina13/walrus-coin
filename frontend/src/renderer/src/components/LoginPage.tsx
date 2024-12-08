import React, { useState, useEffect }from 'react';
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

function LoginPage(): JSX.Element {
  const [error_message, set_error_message] = useState('');
  const [walletPassword, setWalletPassword] = useState('');
  const [walletExists, setWalletExists] = useState(()=> localStorage.getItem("walletExists") == "true");
  const [startNet, setStartNet] = useState(false);
  const [newLoading, setNewLoading] = useState(false);
  const [existingLoading, setExistingLoading] = useState(false);
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

  const handleLogin = async () => {
    setExistingLoading(true);

    if (startNet == true) {
      console.log("IN STARTNEXT TRUE");
      if (walletPassword == '') {
        setExistingLoading(false);
        set_error_message("The password cannot be blank.");
        return;
      }

      const passres = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "walletpassphrase", params: [walletPassword, 99999999]}, {
          auth: {
            username: 'user',
            password: 'password'
          },
          headers: {
            'Content-Type': 'text/plain;',
          },
        } as any
      );
        
        console.log(passres);
        // error check password
        console.log(passres.data.error);
        if (passres.data.error != null) {
          setExistingLoading(false);
          set_error_message("Incorrect password, please try again.");
          setWalletPassword('');
          return;
        }

        navigate('/status');
    } else if(walletPassword != '') {
      
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

        const address_res = await window.versions.getAddress();

        localStorage.setItem("walletaddr", address_res);
        
        // const btcdres = await window.versions.startProcess('../backend/btcd/btcd', ['-C', '../backend/btcd.conf', '--notls', '--txindex', '--addrindex', '--miningaddr', address_res]);
        const btcdres = await window.versions.startBtcd(address_res);

        const connect_network = await window.versions.connectNet();

        const kill_wallet = await window.versions.killWallet();

        const start_wallet = await window.versions.startWallet();

        setStartNet(true);

        const passres = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "walletpassphrase", params: [walletPassword, 99999999]}, {
          auth: {
            username: 'user',
            password: 'password'
          },
          headers: {
            'Content-Type': 'text/plain;',
          },
        });
        
        console.log(passres);
        // error check password
        console.log(passres.data.error);
        if (passres.data.error != null) {
          setExistingLoading(false);
          set_error_message("Incorrect password, please try again.");
          setWalletPassword('');
          return;
        }

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
              onClick={()=>{!existingLoading && navigate('/sign-in')}}
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
                            <button 
                                className="submit bg-yellow-900 text-white px-4 py-2 rounded hover:bg-black duration-300 disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                                type='button'
                                onClick={() => navigate('/register')}
                                >
                                Generate a New Wallet
                            </button>
                        </div>
                    </div>
                </div>
                <div className='flex space-x-1 mt-4'>
                    <div>Not sure yet?</div><div onClick={()=>{navigate('/sign-in')}} className='cursor-pointer text-blue-800 underline'>Return to home</div>
                </div>
            </div>
        </div>
    );
  }


}

export default LoginPage;