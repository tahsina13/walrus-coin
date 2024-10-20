import { PageHeader, PageSubheader, VerticalSpace1, HorizontalSpace1, HorizontalSpace2, HorizontalSpace3, BigText, HorizontalLine } from '../components/Components'
import React, {useState, useRef} from "react"
import ProxyIcon from '../assets/proxy2.png'

const testProxies = [{name:"node1", id:1, cost:10}, {name:"node2", id:2, cost:10}, {name:"node3", id:3, cost:10}, {name:"node4", id:4, cost:10}]

function Switch({text, onClick, isChecked}): JSX.Element {
  const handleCheckboxChange = () => {
    onClick()
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
              onChange={handleCheckboxChange}
              className='sr-only'
              onClick={onClick}
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
              onChange={handleCheckboxChange}
              className='sr-only'
              onClick={onClick}
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
    <div>
      <HorizontalLine />
      <div className="flex flex-row h-10 w-full justify-start">
        <HorizontalSpace1 />
        <img src={ProxyIcon} alt="ProxyIcon" className="w-7 h-7" />
        <HorizontalSpace3 />
        <div>{node.name}</div>
        <HorizontalSpace2 />
        <div>{node.cost}</div>
        <HorizontalSpace2 />
        <SmallSwitch text="Use as Proxy:" onClick={handleClicked} isChecked={selectedID === node.id} />
      </div>
    </div>
  )
}

function ProxyList({proxies, handleClicked, selectedID}): JSX.Element {
  return (<>
    {proxies.map((proxy, index) => <ProxyNode node={proxy} onClick={handleClicked} selectedID={selectedID}/>)}
    </>
  )
}


function ProxyPage(): JSX.Element {
  const [CurrentProxyName, setCurrentProxyName] = useState("none")
  const [selectedID, setSelectedID] = useState(0)

  const selfnode = {name:"me!", id:0, cost:10}

  const handleSelectProxy = (node) => {
    setCurrentProxyName(node.name)
    setSelectedID(node.id)
  }

  const handleSelectSelfProxy = () => {
    handleSelectProxy(selfnode)
  }

    return (
      <div className="container flex flex-col h-screen">
        <div className="ml-10">
          <PageHeader name={'Proxy'} />
          <VerticalSpace1 />
          <div className="container flex flex-row">
            <Switch text="Serve As Proxy:" onClick={handleSelectSelfProxy} isChecked={selectedID === selfnode.id} />
            <HorizontalSpace1 />
            <BigText name={"Current Proxy: " + CurrentProxyName} />
          </div>
        </div>
        <HorizontalLine />
        <div className="ml-10">
          <PageSubheader name={'Available Proxies:'} />
        </div>
        <ProxyList proxies={testProxies} handleClicked={handleSelectProxy} selectedID={selectedID}/>
      </div>
    )
  }
  
export default ProxyPage
//add list of proxies