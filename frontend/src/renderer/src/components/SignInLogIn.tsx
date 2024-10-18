import React, { useState }from 'react';
import { useNavigate } from 'react-router-dom';
import WalrusCoinLogo from '../assets/walrus-coin-icon.png';

function SignInLogIn(): JSX.Element {

  // const [inputValue, setInputValue] = useState('');
  // const [inputValue2, setInputValue2] = useState('');
  const navigate = useNavigate();

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setInputValue(e.target.value);
  // }

  // const handleInputChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setInputValue2(e.target.value);
  // }

  const handleLogin = async () => {
    // check wallet exists first
    navigate('/status')
  }
  const handleRegister = async () => {
    navigate('/register'); // register conditions
  }

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
                  <div className="submit-container flex">
                    <div className="register-container">
                        <button 
                            className="submit bg-yellow-900 text-white p-2 rounded hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                            type='button'
                            onClick={handleRegister}
                          >
                            Create New Wallet
                        </button>
                    </div>
                    <div className="submit-container flex">
                        <button 
                          className="submit bg-yellow-900 text-white p-2 rounded hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                          type='button'
                          onClick={handleLogin}
                        >
                          Use Existing Wallet
                        </button>
                    </div>
                  </div>
              </div>
          </div>
      </div>
  );
}

export default SignInLogIn;
