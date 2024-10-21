import React, { useState, useEffect }from 'react';
import { useNavigate } from 'react-router-dom';
import { ipcRenderer } from 'electron';


function RegisterPage(): JSX.Element {

  const [walletPassword, setWalletPassword] = useState('');
  const [walletExists, setWalletExists] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [error_message, set_error_message] = useState('');

  const navigate = useNavigate();

  const handleCreateWallet = async () => {
    if(walletPassword) {
      await window.versions.createWallet("../backend/btcwallet/btcwallet.exe", ["--create"], [walletPassword, walletPassword, "n", "n", "OK"]);
      navigate('/firstLogin');
      // await window.versions.startProcess("../backed/btcd/cmd/btcctl", ["--wallet", "--rpcuser=user", "--rpcpass=password", "--rpcserver=localhost:8332", "listaccounts"]);
    }
    else {
      set_error_message("The password cannot be blank.");
    }
  }

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
        <div style={{ backgroundColor: '#997777' }} className="container flex justify-center items-center h-screen w-screen">
            <div className="flex flex-col items-center">
              <div className="header">
                  <div className="text-xl text-white"> Create a Wallet </div>
              </div>
              <div className="inputs mt-4">
                <div className="input mb-4 flex space-x-2">
                    <input 
                        type="password" 
                        placeholder='Password' 
                        className="border border-gray-300 p-2 rounded focus:outline-none"
                        value={walletPassword}
                        onChange={(event)=>{setWalletPassword(event.target.value)}}
                        required
                        />
                        <div className="register-container flex justify-end w-full">
                    <div className="submit-container flex">
                      <button 
                          className="submit bg-yellow-900 text-white px-4 py-2 rounded hover:bg-black duration-300 disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
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
              <div className='text-white'>{error_message}</div>
              <div className='flex space-x-1'>
                <div>Not sure yet?</div><div onClick={()=>{navigate('/sign-in')}} className='cursor-pointer text-blue-800 underline'>Return to home</div>
              </div>
            </div>
        </div>
    );
  } else{
    return (
        <div style={{ backgroundColor: '#997777' }} className="container flex justify-center items-center h-screen w-screen">
            <div className="flex flex-col items-center">
                <div className="header">
                    <div className="text"> You already have a wallet! </div>
                </div>
                <div className="inputs mt-4">
                    <div className="submit-container flex">
                      <div className="register-container flex justify-end w-full">
                          <button 
                            className="submit bg-yellow-900 text-white px-4 py-2 rounded hover:bg-black duration-300 disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
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