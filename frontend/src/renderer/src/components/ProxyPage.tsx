import { PageHeader, Switch, StandardSpace } from '../components/Components'
import React, {useState, useRef} from "react"

const handleProxyChange = event => {
  alert("hhhhhh") //TODO set user as Proxy
}

function ProxyPage(): JSX.Element {
    return (
      <div className="container flex flex-col h-screen pl-10">
        <PageHeader name={'Proxy'} />
        <StandardSpace />
        <Switch text={'Acting as Proxy:'} onClick={handleProxyChange} />
      </div>
    )
  }
  
export default ProxyPage