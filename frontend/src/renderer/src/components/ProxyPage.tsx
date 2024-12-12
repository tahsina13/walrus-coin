import { PageHeader, PageSubheader, VerticalSpace1, VerticalSpace2, HorizontalSpace1, HorizontalSpace2, HorizontalSpace3, BigText, HorizontalLine } from '../components/Components'
import React, {useState, useRef, useEffect} from "react"
import ProxyIcon from '../assets/proxy2.png'
import axios from 'axios'


async function discoverProxies(){
  let resp = await axios.post("http://localhost:5001/api/v0/proxy/discover?count=100")
  let data = resp.data
  return data
}
async function connect(remoteproxyaddr, port){
  await axios.post(`http://localhost:5001/api/v0/proxy/connect?remoteProxyAddr=http://${remoteproxyaddr}&port=${port}`)
}
async function disconnect(){
  await axios.post("http://localhost:5001/api/v0/proxy/disconnect")
}
async function start(price, ipaddr){
  let addr = localStorage.getItem('walletaddr')
  await axios.post(`http://localhost:5001/api/v0/proxy/start?price=${price}&ipaddr=${ipaddr}&wallet=${addr}`)
}
async function stop(){
  await axios.post("http://localhost:5001/api/v0/proxy/stop")
}
async function getBytes(){
  let resp = await axios.post("http://localhost:5001/api/v0/proxy/bytes")
  let data = resp.data
  return parseFloat(data['bytes'])
}

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
          <BigText name="Use as Proxy (Set computer proxy settings to point to localhost:8083): "/>
        </div>
      </div>
    </div>
  )
}

function ProxyPage(): JSX.Element {
  const [CurrentProxyName, setCurrentProxyName] = useState(()=>{
    let data = localStorage.getItem('currentProxyName')
    if(data)
      return data
    else
      return "none"
  })
  const [selectedID, setSelectedID] = useState(()=>{
    let data = localStorage.getItem('selectedID')
    if(data)
      return parseInt(data)
    else
      return -1
  })
  const [selectedCost, setSelectedCost] = useState(()=>{
    let data = localStorage.getItem('selectedCost')
    if(data)
      return parseFloat(data)
    else
      return 0
  })
  const [yourCost, setYourCost] = useState(0.002)
  const [ipaddr, setIPAddr] = useState(() => {
    let data = localStorage.getItem('ipaddr')
    if(data)
      return data
    else
      return "http://localhost:8084"
  })
  const [bytes, setBytes] = useState(()=>{
    let data = localStorage.getItem('bytes')
    if(data)
      return parseInt(data)
    else
      return 0
  });
  var bytesInterval;
  const selfnode = {name:"self", id:0}
  const [proxies, setProxies] = useState(()=>{
    let data = localStorage.getItem('proxies')
    if(data)
      return JSON.parse(data)
    else
      return []
    })
  useEffect(() => {
    var fetchData = async () => {
      let data = await discoverProxies()
      console.log(data)
      if(data == null)
        setProxies([])
      else{
        let temp = data.map((element, idx) => ({name: element['url'], id: idx + 1, cost: element['price']}))
        setProxies(temp)
        localStorage.setItem('proxies', JSON.stringify(temp))
      }
    }


    fetchData()
    setInterval(fetchData, 100000)
  }, [])
  

  const handleSelectProxy = async (node) => {
    if (node == selfnode) {
      if(selectedID == node.id){
        setSelectedID(-1)
        await stop()
      }
      else{
        if(selectedID != -1)
          await disconnect()
        setSelectedID(node.id)
        localStorage.setItem('selectedID', node.id.toString())
        await start(yourCost, "http://localhost:8084")
        // await start(0, ipaddr)
      }
    } else 
    if(selectedID == node.id)
    {
      await disconnect()
      setCurrentProxyName("none")
      localStorage.setItem('currentProxyName', "none")
      setSelectedID(-1)
      localStorage.setItem('selectedID', "-1")
      setSelectedCost(0)
      localStorage.setItem('selectedCost', "0")
      // const conne = await axios.post(`http://localhost:5001:5001/api/v0/routing/provide?arg=${file.CID}`);
    }
    else 
    {
      if(selectedID != 0 && selectedID != -1){
        await disconnect()
        //TODO SEND PAYMENT
        setBytes(0)
        localStorage.setItem('bytes', "0")
        clearInterval(bytesInterval)
      }
      setCurrentProxyName(node.name)
      localStorage.setItem('currentProxyName', node.name)
      setSelectedID(node.id)
      localStorage.setItem('selectedID', node.id.toString())
      setSelectedCost(node.cost)
      localStorage.setItem('selectedCost', node.cost.toString())
      await connect(node.name, 8083)
      bytesInterval = setInterval(async ()=>{ 
        let curbytes = await getBytes()
        setBytes(curbytes)
        localStorage.setItem('bytes', curbytes.toString())
      }, 10000)
    } 
  }

  const handleSelectSelfProxy = () => {
    handleSelectProxy(selfnode)
  }

  const setSelfCost = (cost) => {
    setYourCost(parseFloat(cost))
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
          <p>Cost:</p>
          <input 
            style={{"border":"solid black 1px"}} 
            value={yourCost} 
            onChange={(event) => {
              const value = event.target.value;
              if (value === '' || value === '.' || !isNaN(parseFloat(value))) {
                setYourCost(value === '' || value === '.' ? 0 : parseFloat(value));
              }
            }} 
            placeholder='Cost (WACO/MB)'
          />
          <p>IP: </p>
          <input style={{"border":"solid black 1px"}} value={ipaddr} onChange={(event)=>(setIPAddr(event.target.value))} placeholder='IP ADDR (http://<IP>:<PORT>)'></input>
          <div className="w-1/4">
            <BigText name={"Current Proxy: " + CurrentProxyName} />
          </div>
          {((selectedID === selfnode.id) ? <><div className="w-1/4"><BigText name={"Selling for: " + yourCost + " WACO/MB"}/></div> <div className="w-1/4"></div></>
          : <div className="w-1/4"><BigText name={"Proxy Cost: " + selectedCost + " WACO/MB"} /></div>)}
          <BigText name={"Total MB: " + (bytes/1000000)} />
        </div>
      </div>
      <VerticalSpace1 />
      <HorizontalLine />
      <div className="ml-10">
        <PageSubheader name={'Available Proxies:'} />
        <VerticalSpace1 />
      </div>
      <ProxyHeader />
      <div className="flex flex-col w-full divide-y-2 border-t-2 border-b-2">
        {proxies.length == 0? <div> No proxies available </div> : proxies.map((proxy) => <ProxyNode node={proxy} onClick={handleSelectProxy} selectedID={selectedID}/>)}
      </div>
    </div>
  )
}


//add list of files

export default ProxyPage