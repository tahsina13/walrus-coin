import React, { useState }from 'react';
import { useNavigate } from 'react-router-dom';
import WalrusCoinLogo from '../assets/walrus-coin-icon.png';

function SignInLogIn(): JSX.Element {

  const [inputValue, setInputValue] = useState('');
  const [inputValue2, setInputValue2] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }

  const handleInputChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue2(e.target.value);
  }

  const handleLogin = async () => {
    if (inputValue && inputValue2){
      navigate('/status'); // add more conditions when we figure out login
    }
  }

  return (
      <div style={{ backgroundColor: '#997777' }} className="container flex justify-center items-center h-screen w-screen">
          <div className="flex flex-col items-center">
              <img src={WalrusCoinLogo} alt="WalrusCoin" className="w-80 h-80" />
              <div className="flex justify-center p-4">
                  <span className="text-white text-5xl">{"WalrusCoin"}</span>
              </div>
              <div className="header">
                  <div className="text">Register / Log In</div>
              </div>
              <div className="inputs mt-4">
                  <div className="input mb-4">
                      <input 
                          type="text" 
                          placeholder='Text1' 
                          className="border border-gray-300 p-2 rounded focus:outline-none"
                          value={inputValue}
                          onChange={handleInputChange}
                      />
                      <input 
                          type="text2" 
                          placeholder='Text2' 
                          className="border border-gray-300 p-2 rounded focus:outline-none block mt-4"
                          value={inputValue2}
                          onChange={handleInputChange2}
                      />
                  </div>
                  <div className="submit-container flex">
                    <div className="register-container">
                        <button 
                            className="submit bg-yellow-900 text-white p-2 rounded hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                            type='button'
                            onClick={handleLogin}
                            disabled={!inputValue}
                          >
                              Register
                        </button>
                    </div>
                    <div className="login-container flex justify-end w-full">
                        <button 
                          className="submit bg-yellow-900 text-white p-2 rounded hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                          type='button'
                          onClick={handleLogin}
                          disabled={!inputValue}
                        >
                            Log In
                        </button>
                    </div>
                  </div>
              </div>
          </div>
      </div>
  );
}

export default SignInLogIn;
