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

function LoginPage(): JSX.Element {
    const [error_message, set_error_message] = useState('');
    const [walletPassword, setWalletPassword] = useState('');

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

    if(walletPassword) {
        // start wallet (ADD: check for error)
        // const res = await window.versions.startProcess("../backend/btcwallet/btcwallet", []);

        // console.log(res);
        console.log("started btcwallet");

        // wait for btcwallet to start (maybe add loading symbol of some sort?)
        await sleep(1000);
        console.log("started btcwallet");
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
    else {
        set_error_message("The password cannot be blank.");
    }
  };

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
              <button 
                  className="submit bg-yellow-900 text-white px-4 py-2 rounded hover:bg-black duration-300 disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                  type='button'
                  onClick={() => handleLogin()}
                  // disabled={!inputValue}
                  >
                    Login
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className='text-white'>{error_message}</div>
      <div className='flex space-x-1'>
        <div>Not decide yet?</div><div onClick={()=>{navigate('/sign-in')}} className='cursor-pointer text-blue-800 underline'>Back to home</div>
      </div>
    </div>
</div>
  );
}

export default LoginPage;