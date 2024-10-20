import { ReactElement, JSXElementConstructor, ReactNode, useState, useEffect } from 'react'
import {PageHeader} from '../components/Components'
import AccountIcon from '../assets/avatar.png'
import Dollar from '../assets/DollarIcon.png'

function AccountPage(): JSX.Element {
  const [defaultFileCost, setDefaultFileCost] = useState(() => {
    const defaultFileCost = localStorage.getItem("defaultFileCost");
    if (defaultFileCost) {
      return parseInt(defaultFileCost);
    }
    return 1; 
  })

  useEffect(() => {
    localStorage.setItem("defaultFileCost", defaultFileCost.toString());
  })

  return (
    <div className="container flex flex-col h-screen pl-10">
      <PageHeader name={'Account'} />
      <ManageProfileWallet />
      <Setting name={'Token and Payment'} bg={true} />
      <div className="mt-10"></div>
      <Setting name={'Security'} bg={false} />
      <Setting name={'Two-Factor Authentification'} bg={true} />
      <div>
        <div className="mt-10">{"Default File Cost:  "}
          {/* prettier-ignore */}
          <input style={{width: `${defaultFileCost.toString().length + 2}ch`}} value={defaultFileCost} onChange={(event) => setDefaultFileCost(parseInt(event.target.value))} type='number'></input>
        </div>
      </div>
    </div>
  )
}

function ManageProfileWallet(): JSX.Element {
  return (
    <div className="container flex flex-row justify-between w-2/3">
      <div className="container flex flex-row items-center mt-10 bg-blue-100 rounded hover:bg-blue-200 w-1/3 pt-2 pb-2">
        <div className="ml-5 text-2xl">Manage Profile</div>
        <img src={Dollar} alt="Dollar" className="h-10 ml-5" />
      </div>
      <div className="container flex flex-row items-center mt-10 bg-blue-100 rounded hover:bg-blue-200 w-1/3 pt-2 pb-2">
        <div className="ml-5 text-2xl">Manage Wallet</div>
        <img src={AccountIcon} alt="account" className="h-10 ml-5" />
      </div>
    </div>
  )
}

function Setting({name, bg}): JSX.Element {
  if(bg){
    return (
      <div className="mt-10 container w-2/3 bg-blue-100 hover:bg-blue-200 rounded pt-2 pb-2">
        <div className="ml-5 text-2xl">{name}</div>
      </div>
    )
  }
  return (
    <div className="mt-10 container w-2/3 rounded pt-2 pb-2">
      <div className="ml-5 text-2xl">{name}</div>
    </div>
  )
}

export default AccountPage