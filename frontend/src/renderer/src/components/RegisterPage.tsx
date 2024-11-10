import React, { useState, useEffect }from 'react';
import { useNavigate } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import axios from 'axios';
import { LoadingButton } from '@mui/lab';


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function RegisterPage(): JSX.Element {

  const [walletPassword, setWalletPassword] = useState('');
  const [walletExists, setWalletExists] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const navigate = useNavigate();

  const handleCreateWallet = async () => {
    setLoading(true);
    try {
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

    }catch (error) {
      setHasError(true);
      console.log(error);
    }
  }
  // const handleCreateAccount = async () => {
  //   if (true){ // add conditions when we figure out login
  //     navigate('/status');
  //   }
  // }
  const returnHome = async () => {
    navigate('/sign-in')
  }

  const closeErrorMessage = () => {
    setHasError(false);
    setLoading(false);
  };

  
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
                        <LoadingButton
                          loading={loading}
                          onClick={handleCreateWallet}
                          variant="contained"
                          loadingPosition='end'
                          endIcon={null}
                          sx={{
                            textTransform: 'none', 
                            backgroundColor: '#78350f',  // bg-yellow-900
                            padding: '0px 40px'
                          }}
                          className="h-8 w-16 bg-yellow-900 text-white rounded over:bg-black disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                        >
                          Create
                        </LoadingButton>
                      </div>
                    </div>
                    <div className='flex space-x-1 mt-2'>
                      <div>Not sure yet?</div><div onClick={()=>{navigate('/sign-in')}} className='cursor-pointer text-blue-800 underline'>Return to home</div>
                    </div>
                </div>
                <div>
                {hasError && (
                  <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-200 text-red-600 p-2 rounded flex items-start">
                    <span>Oops! There are some trouble creating your wallet. Please try again.</span>
                    <button onClick={closeErrorMessage} className="ml-2 text-gray-500 font-bold">x</button>
                  </div>
                )}
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