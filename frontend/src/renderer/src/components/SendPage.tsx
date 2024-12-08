import React, { useState }from 'react';
import { useNavigate } from 'react-router-dom';
import WalrusCoinLogo from '../assets/walrus-coin-icon.png';
import { electronAPI } from '@electron-toolkit/preload';
import { ipcRenderer } from 'electron';
import path from 'path';
import axios from 'axios';
import { LoadingButton } from '@mui/lab';
import { PageHeader } from './Components';
import ConfirmationDialog from './ConfirmationDialog';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function SendPage(): JSX.Element {

  // const [inputValue, setInputValue] = useState('');
  // const [inputValue2, setInputValue2] = useState('');
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [destAddress, setDestAddress] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
      setDialogOpen(false);
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      // const res = await window.versions.startWallet();

      // const address_res = await window.versions.getAddress();

      // localStorage.setItem("walletaddr", address_res);
      
      // const btcdres = await window.versions.startProcess('../backend/btcd/btcd', ['-C', '../backend/btcd.conf', '--notls', , '--txindex', '--addrindex', '--miningaddr', address_res]);
      console.log("sending coin");
      console.log(destAddress);
      console.log(amount);
      setDialogOpen(false); // Closes dialog after confirmation
      const sendres = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "sendtoaddress", params: [destAddress, amount]}, {
        auth: {
          username: 'user',
          password: 'password'
        },
        headers: {
          'Content-Type': 'text/plain;',
        },
      } as any
    );
      console.log(sendres);
      const ret = await window.versions.killWallet();
      const ret2 = await window.versions.startWallet();
      console.log("killed wallet"); 
      navigate('/transactions');
    }
    catch (error) {
      setHasError(true);
      setLoading(false);
      console.log(error);
    }
  };

  const closeErrorMessage = () => {
    setHasError(false);
  };

  return (
      <div className='coin-page-container h-full flex flex-col'>
        <div className="ml-10" style={{ marginBottom: '30px', padding: '10px 20px',}}>
          <PageHeader name={'Send Coin'} />
        </div>
          <div className="flex flex-col flex-grow justify-center">
              <div className="submit-container flex flex-col ml-2 mr-2 mt-4 items-center justify-center">
                  <div className="inputs-container flex flex-col w-1/3 items-center justify-center">
                    <div className="amount-input mb-4 w-full flex justify-center">
                      <input 
                          type="number" 
                          placeholder='WACO Amount'
                          className="border border-gray-300 p-2 rounded focus:outline-none w-10/12"
                          value={amount || ''}
                          onChange={(event)=>{setAmount(event.target.value ? Number(event.target.value): undefined)}}
                        />
                    </div>
                    <div className="address-input mb-4 w-full flex justify-center">
                      <input 
                          type="text" 
                          placeholder='Destination Address' 
                          className="border border-gray-300 p-2 rounded focus:outline-none w-10/12"
                          value={destAddress}
                          onChange={(event)=>{setDestAddress(event.target.value); setHasError(false);}}
                        />
                    </div>
                  </div>
                  <div className="submit-container">
                    <LoadingButton
                      loading={loading}
                      onClick={handleOpenDialog}
                      variant="contained"
                      disabled={loading || !amount || !destAddress}
                      loadingPosition='end'
                      endIcon={null}
                      sx={{
                        textTransform: 'none', 
                        backgroundColor: '#78350f',
                        padding: '5px 30px'
                      }}
                      className="bg-yellow-900 text-white rounded disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Send Coin
                    </LoadingButton>
                  </div>
              </div>
              <div className='bottom-error'>
                {hasError && (
                  <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-200 text-red-600 p-2 rounded flex items-start">
                    <span>Unable to send coin to address: {destAddress}. Please make sure the address is correct.</span>
                    <button onClick={closeErrorMessage} className="ml-2 text-gray-500 font-bold">x</button>
                  </div>
                )}
              </div>
          </div>
          <div className="ml-4 mb-2">
            <button 
              className="text-white px-4 py-2 rounded" 
              style={{ backgroundColor: '#997777' }}
              onClick={() => navigate('/transactions')}
            >
              Back
            </button>
          </div>
          <ConfirmationDialog
              open={dialogOpen}
              onClose={handleCloseDialog}
              onConfirm={handleSend}
              title="Send Coin"
              message={`Are you sure you want to send ${amount} WACO to this address?`}
            />
      </div>
  );
}

export default SendPage;
