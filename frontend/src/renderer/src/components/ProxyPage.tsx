import { PageHeader, PageSubheader, VerticalSpace1, VerticalSpace2, HorizontalSpace1, HorizontalSpace2, HorizontalSpace3, BigText, HorizontalLine } from '../components/Components'
import React, {useState, useRef} from "react"
import ProxyIcon from '../assets/proxy2.png'
import axios from 'axios'


const testProxies = [{name:"node1", id:1, cost:0.004353}, {name:"node2", id:2, cost:0.343251}, {name:"node3", id:3, cost:0.004321}, {name:"node4", id:4, cost:1.002121}, {name:"bob", id:5, cost:10000.0}]

function Input({setCost}): JSX.Element {
  const [isSwitched, setIsSwitched] = useState(false)
  const inputRef = useRef(null)

  const setSetCost = (event) => {
    if(event.keyCode === 13 && !isNaN(+event.target.value) && (event.target.value > 0)){
      setCost(event.target.value)
      handleSwitch()
    }
  }


  const handleSwitch = () => {
    setIsSwitched(!isSwitched)
  }

  return (
    <div>
      <input ref={inputRef} type="number" className={"" + (isSwitched? "" : "hidden") + " text-black text-xl h-8 w-2/3 pl-2 pr-2 rounded bg-blue-100"} onKeyUp={(event) => setSetCost(event)} />
      <button className={"" + (isSwitched? "hidden" : "") + " bg-blue-500 hover:bg-blue-700 text-white text-xl px-4 rounded w-2/3"} onClick={() => handleSwitch()}>
        Change Sell Cost
      </button>
    </div>
  )
}

function Switch({text, onClick, isChecked}): JSX.Element {
  const handleCheckboxChange = () => {
    onClick()
    console.log("IN  SWITCH");
  }

  const checkedClassName="translate-x-10"
  const checkedBGClassName="bg-green-600"
  return (
  <div className='flex flex-row h-8'>
      <text className="text-xl mr-4 h-8"> {text} </text>
      <label className='flex cursor-pointer select-none items-center '>
          <div className='relative'>
          <input
              type='checkbox'
              checked={isChecked}
              onClick={handleCheckboxChange}
              className='sr-only'
          />
          <div className={'block h-6 w-16 rounded-full bg-gray-300 ' + (isChecked ? checkedBGClassName   : "")}></div>
          <div className={'transform dot absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition ' + (isChecked ? checkedClassName : "")}></div> 
          </div>
      </label>
      </div>
  )
}

function SmallSwitch({text, onClick, isChecked}): JSX.Element {

  const handleCheckboxChange = () => {
    onClick()
    console.log("IN SMALL SWITCH");
  }

  const checkedClassName="translate-x-6"
  const checkedBGClassName="bg-green-600"
  return (
  <div className='flex flex-row h-6'>
      <text className="text-l mr-4 h-6"> {text} </text>
      <label className='flex cursor-pointer select-none items-center '>
          <div className='relative'>
          <input
              type='checkbox'
              checked={isChecked}
              className='sr-only'
              onClick={handleCheckboxChange}
          />
          <div className={'block h-4 w-10 rounded-full bg-gray-300 ' + (isChecked ? checkedBGClassName   : "")}></div>
          <div className={'transform dot absolute left-1 top-1 h-2 w-2 rounded-full bg-white transition ' + (isChecked ? checkedClassName : "")}></div> 
          </div>
      </label>
    </div>
  )
}

function ProxyNode({node, onClick, selectedID}): JSX.Element {
  
  const handleClicked = () => {
    onClick(node)
  }

  return (
    <div className="flex flex-row w-full h-12 justify-start items-center">
      <HorizontalSpace1 />
      <div className="box flex flex-row justify-left w-1/6">
        <img src={ProxyIcon} alt="ProxyIcon" className="w-7 h-7" />
        <HorizontalSpace3 />
        <div>{node.name}</div>
      </div>
      <div className="box flex flex-row justify-left w-1/3">
        <HorizontalSpace2 />
        <div>{node.cost}</div>
      </div>
      <div className="box flex flex-row justify-left w-1/3">
        <HorizontalSpace2 />
        <SmallSwitch text="" onClick={handleClicked} isChecked={selectedID === node.id} />
      </div>
    </div>
  )
}

function ProxyHeader(): JSX.Element {
  return (
    <div className="flex flex-col">
      <HorizontalLine />
      <VerticalSpace2 />
      <div className="flex flex-row w-full h-12 justify-start">
        <HorizontalSpace1 />
        <div className="box flex flex-row justify-left w-1/6">
          <div className="box w-7 h-7"> </div>
          <HorizontalSpace3 />
          <BigText name="Name: "/>
        </div>
        <div className="box flex flex-row justify-left w-1/3">
          <HorizontalSpace2 />
          <BigText name="Cost (WACO/MB): "/>
        </div>
        <div className="box flex flex-row justify-left w-1/3">
          <HorizontalSpace2 />
          <BigText name="Use as Proxy: "/>
        </div>
      </div>
    </div>
  )
}

function ProxyList({proxies, handleClicked, selectedID}): JSX.Element {
  return (<div>
    <ProxyHeader />
    <div className="flex flex-col w-full divide-y-2 border-t-2 border-b-2">
    {proxies.map((proxy, index) => <ProxyNode node={proxy} onClick={handleClicked} selectedID={selectedID}/>)}
    </div>
    </div>
  )
}


function ProxyPage(): JSX.Element {
  const [CurrentProxyName, setCurrentProxyName] = useState("none")
  const [selectedID, setSelectedID] = useState(-1)
  const [selectedCost, setSelectedCost] = useState(0)
  const [selfProxyID, setSelfProxyID] = useState(-1);

  const [selfnode, setSelfnode] = useState({name:"self", id:0, cost:10})

  const handleSelectProxy = async (node) => {
    if (node == selfnode) {

    } else 
    if(selectedID == node.id)
    {
      const disconnect_proxy = await axios.post(`http://localhost:5001/api/v0/proxy/disconnect`);
      console.log(disconnect_proxy);
      setCurrentProxyName("none")
      setSelectedID(-1)
      setSelectedCost(0)
      // const conne = await axios.post(`http://localhost:5001/api/v0/routing/provide?arg=${file.CID}`);
    }
    else 
    {
      const connect_proxy = await axios.post(`http://localhost:5001/api/v0/proxy/connect?arg=${node.id}`);
      setCurrentProxyName(node.name)
      setSelectedID(node.id)
      setSelectedCost(node.cost)
    } 
  }

  const handleSelectSelfProxy = () => {
    handleSelectProxy(selfnode)
  }

  const setSelfCost = (cost) => {
    setSelfnode({name:"self", id:0, cost:cost})
  }

  return (
    <div className="container flex flex-col h-screen">
      <div className="ml-10">
        <PageHeader name={'Proxy'} />
        <VerticalSpace1 />
        <div className="container flex flex-row">
          <div className="w-1/4">
            <Switch text="Serve As Proxy:" onClick={handleSelectSelfProxy} isChecked={selectedID === selfnode.id} />
          </div>
          <div className="w-1/4">
            <BigText name={"Current Proxy: " + CurrentProxyName} />
          </div>
          {((CurrentProxyName === "self") ? <><div className="w-1/4"><BigText name={"Selling for: " + selfnode.cost + " WACO/MB"}/></div> <div className="w-1/4"> <Input setCost={setSelfCost}/></div></>
          : <div className="w-1/4"><BigText name={"Proxy Cost: " + selectedCost + " WACO/MB"} /></div>)}
        </div>
      </div>
      <VerticalSpace1 />
      <HorizontalLine />
      <div className="ml-10">
        <PageSubheader name={'Available Proxies:'} />
        <VerticalSpace1 />
      </div>
      <ProxyList proxies={testProxies} handleClicked={handleSelectProxy} selectedID={selectedID}/>
    </div>
  )
}


//add list of files

export default ProxyPage