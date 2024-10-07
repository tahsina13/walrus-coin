import React, { useState }from 'react';
import { useNavigate } from 'react-router-dom';

function SignInLogIn(): JSX.Element {

  const [inputValue, setInputValue] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }

  const handleLogin = async () => {
    if (inputValue){
      navigate('/status'); // add more conditions when we figure out login
    }
  }



  return (
      <div className="container flex justify-center items-center h-screen w-screen">
          <div className="flex flex-col items-center">
              <div className="header">
                  <div className="text">Sign In / Log In</div>
              </div>
              <div className="inputs mt-4">
                  <div className="input mb-4">
                      <input 
                          type="text" 
                          placeholder='Key' 
                          className="border border-gray-300 p-2 rounded focus:outline-none"
                          value={inputValue}
                          onChange={handleInputChange}
                      />
                  </div>
                  <div className="submit-container flex justify-end w-full">
                      <button 
                        className="submit bg-blue-500 text-white p-2 rounded disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
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
  );
}

export default SignInLogIn;
