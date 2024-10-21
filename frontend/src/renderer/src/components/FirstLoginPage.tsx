import React, { useState }from 'react';
import { useNavigate } from 'react-router-dom';
import WalrusCoinLogo from '../assets/walrus-coin-icon.png';
import { electronAPI } from '@electron-toolkit/preload';
import { ipcRenderer } from 'electron';
import path from 'path';
import axios from 'axios';
import GreenCheck from '../assets/check.png';
import Copy from '../assets/copy.png'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function FirstLoginPage(): JSX.Element {
    const navigate = useNavigate();
    const [private_key, set_private_key] = useState("PRIVATE_KEY_PLACE_HOLDER");
    const [public_key, set_public_key] = useState("PUBLIC_KEY_PLACE_HOLDER");

    const copy = async (target) => {
        await navigator.clipboard.writeText(target);
        alert('Copied into clipboard.');
      }

    return (
        <div style={{ backgroundColor: '#997777' }} className="container flex justify-center items-center h-screen w-screen">
            <div className="flex flex-col items-center space-y-4">
                <div className='bg-green-100 rounded-xl h-12 px-4 flex content-center space-y-2 items-center'>
                    <img src={GreenCheck} alt="Check" className="w-8 h-8" />
                    <div className='text-center ml-2 mt-0'>Wallet generated successfully!</div>
                </div>
                <div style={{backgroundColor: "#f1e1bf"}} className='text-center p-4 rounded-xl content-center flex'>
                    <div>Your public key: {public_key}</div>
                    <button className='ml-2' onClick={() => copy(public_key)} disabled={!public_key}><img src={Copy} alt='Copy' className='w-8 h-8 content-center'/></button>
                </div>
                <div style={{backgroundColor: "#f1e1bf"}} className='text-center p-4 rounded-xl content-center flex'>
                    <div>Your private key: {private_key}</div>
                    <button className='ml-2' onClick={() => copy(private_key)} disabled={!private_key}><img src={Copy} alt='Copy' className='w-8 h-8'/></button>
                </div>
                <div className="flex">
                    <div className="BackHome-container">
                        <button 
                            className="w-40 duration-300 mx-2 submit bg-yellow-900 text-white py-3 rounded-lg hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                            type='button'
                            onClick={() => navigate('/status')}
                        >
                            Enter Walrus Coin
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FirstLoginPage;
