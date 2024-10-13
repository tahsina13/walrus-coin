import React, { useState }from 'react';
import { useNavigate } from 'react-router-dom';

function RegisterPage(): JSX.Element {

  const [inputValue2, setInputValue2] = useState('');

  const navigate = useNavigate();

  const handleRegister = async () => {
    if (true){ // add conditions when we figure out login
      navigate('/status'); 
    }
  }


  return (
      <div className="container flex justify-center items-center h-screen w-screen">
          <div className="flex flex-col items-center">
              <div className="header">
                  <div className="text"> Register </div>
              </div>
              <div className="inputs mt-4">
                  <div className="input mb-4">
                      <input 
                          type="text" 
                          placeholder='Text1' 
                          className="border border-gray-300 p-2 rounded focus:outline-none"
                          // value={inputValue}
                          // onChange={}
                      />
                      <input 
                          type="text2" 
                          placeholder='Text2' 
                          className="border border-gray-300 p-2 rounded focus:outline-none block mt-4"
                          // value={inputValue2}
                          // onChange={handleInputChange2}
                      />
                  </div>
                  <div className="submit-container flex">
                    <div className="register-container flex justify-end w-full">
                        <button 
                          className="submit bg-blue-500 text-white p-2 rounded disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
                          type='button'
                          onClick={handleRegister}
                          // disabled={!inputValue}
                        >
                            Register
                        </button>
                    </div>
                  </div>
              </div>
          </div>
      </div>
  );
}

export default RegisterPage;