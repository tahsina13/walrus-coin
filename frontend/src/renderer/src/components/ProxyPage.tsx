import { PageHeader } from "../components/AccountPage"
import { useState, useRef } from 'react'

function ProxyPage(): JSX.Element {
    return (
      <div className="container flex flex-col h-screen pl-10">
        <PageHeader name={'Proxy'} />
      </div>
    )
  }
  
export default ProxyPage