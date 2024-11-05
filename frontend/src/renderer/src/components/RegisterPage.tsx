import React, { useState, useEffect }from 'react';
import { useNavigate } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import axios from 'axios';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function RegisterPage(): JSX.Element {

  const [walletPassword, setWalletPassword] = useState('');
  const [walletExists, setWalletExists] = useState(false);
  const [accountName, setAccountName] = useState('');

  const navigate = useNavigate();

  const handleCreateWallet = async () => {
    await window.versions.createWallet("../backend/btcwallet/btcwallet", ["--create"], [walletPassword, walletPassword, "n", "n", "OK"]);

    await sleep(2000);
    await window.versions.startProcess("../backend/btcwallet/btcwallet", ['-C', '../backend/btcwallet.conf']);
    await sleep(500);
    // rpc call for createaccount
    const passres = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "walletpassphrase", params: [walletPassword, 999999]}, {
      auth: {
        username: 'user',
        password: 'password'
      },
      headers: {
        'Content-Type': 'text/plain;',
      },
    });

    console.log(passres);

    // const newaccres = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "createnewaccount", params: ["default_account"]}, {
    //   auth: {
    //     username: 'user',
    //     password: 'password'
    //   },
    //   headers: {
    //     'Content-Type': 'text/plain;',
    //   },
    // });
    // console.log(newaccres);
    navigate('/sign-in');
    // returnHome();
  }
  // const handleCreateAccount = async () => {
  //   if (true){ // add conditions when we figure out login
  //     navigate('/status');
  //   }
  // }
  const returnHome = async () => {
    navigate('/sign-in')
  }

  
  useEffect(() => {
    const checkIfWalletExists = async () => {
      try {
        let log =  await window.versions.startProcess("../backend/btcwallet/btcwallet", []);
        console.log(log)
        setWalletExists(true)

      } catch (error) {
        console.log(error)
        setWalletExists(false)
      }
    };
    checkIfWalletExists();
  }, []);

  if(!walletExists){
    return (
        <div className="container flex justify-center items-center h-screen w-screen">
            <div className="flex flex-col items-center">
                <div className="header">
                    <div className="text"> Create a Wallet </div>
                </div>
                <div className="inputs mt-4">
                    <div className="input mb-4">
                        <input 
                            type="password" 
                            placeholder='Password' 
                            className="border border-gray-300 p-2 rounded focus:outline-none"
                            value={walletPassword}
                            onChange={(event)=>{setWalletPassword(event.target.value)}}
                            />
                    </div>
                    <div className="submit-container flex">
                      <div className="register-container flex justify-end w-full">
                          <button 
                            className="submit bg-blue-500 text-white p-2 rounded disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                            type='button'
                            onClick={handleCreateWallet}
                            // disabled={!inputValue}
                            >
                              Create
                          </button>
                      </div>
                    </div>
                </div>
            </div>
        </div>
    );
  } else{
    return (
        <div className="container flex justify-center items-center h-screen w-screen">
            <div className="flex flex-col items-center">
                <div className="header">
                    <div className="text"> You already have a wallet! </div>
                </div>
                <div className="inputs mt-4">
                    <div className="submit-container flex">
                      <div className="register-container flex justify-end w-full">
                          <button 
                            className="submit bg-blue-500 text-white p-2 rounded disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                            type='button'
                            onClick={returnHome}
                            >
                              Return to home
                          </button>
                      </div>
                    </div>
                </div>
            </div>
        </div>
    );
  }
}

export default RegisterPage;