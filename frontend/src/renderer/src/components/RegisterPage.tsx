import React, { useState, useEffect }from 'react';
import { useNavigate } from 'react-router-dom';
import { ipcRenderer } from 'electron';


function RegisterPage(): JSX.Element {

  const [walletPassword, setWalletPassword] = useState('');
  const [walletExists, setWalletExists] = useState(false);
  const [accountName, setAccountName] = useState('');

  const navigate = useNavigate();

  const handleCreateWallet = async () => {
    setWalletExists(true);
    await window.versions.startProcess("../backend/btcwallet/btcwallet.exe", ["--create"], walletPassword);  
  }
  const handleCreateAccount = async () => {
    if (true){ // add conditions when we figure out login
      navigate('/status');
    }
  }

  
  useEffect(() => {
    const checkIfWalletExists = async () => {
      try {
          await window.versions.startProcess("../backend/btcwallet/btcwallet.exe", []);  
          setWalletExists(true)
      } catch (error) {
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
                    <div className="text"> Create an account </div>
                </div>
                <div className="inputs mt-4">
                    <div className="input mb-4">
                        <input 
                            type="password" 
                            placeholder='Account Name' 
                            className="border border-gray-300 p-2 rounded focus:outline-none"
                            value={accountName}
                            onChange={(event)=>{setAccountName(event.target.value)}}
                            />
                    </div>
                    <div className="submit-container flex">
                      <div className="register-container flex justify-end w-full">
                          <button 
                            className="submit bg-blue-500 text-white p-2 rounded disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                            type='button'
                            onClick={handleCreateAccount}
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
  }
}

export default RegisterPage;