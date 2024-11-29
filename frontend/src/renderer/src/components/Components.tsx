import React, { useState } from 'react'

function HorizontalLine(): JSX.Element {
  return(<hr className="h-px bg-gray-900 border-0 dark:bg-gray-900"></hr>)
}

function VerticalSpace1(): JSX.Element {
    return(<div className="mt-10"></div>)
}

function VerticalSpace2(): JSX.Element {
  return(<div className="mt-4"></div>)
}

function HorizontalSpace1(): JSX.Element {
  return(<div className="ml-10"></div>)
}

function HorizontalSpace2(): JSX.Element {
  return(<div className="ml-40"></div>)
}

function HorizontalSpace3(): JSX.Element {
  return(<div className="ml-4"></div>)
}

function PageHeader({name}): JSX.Element {
    return(<div className="text-4xl mt-8"> {name} </div>)
  }

function PageSubheader({name}): JSX.Element {
  return(<div className="text-2xl mt-4"> {name} </div>)
}

function BigText({name}): JSX.Element {
  return(<div className="text-xl"> {name} </div>)
}

function Switch({text, onClick, check}): JSX.Element {
  const [isChecked, setIsChecked] = useState(check)

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked)
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

function SearchBar({setSearch}): JSX.Element {
  const searchFiles = (event) => {
    if(event.keyCode === 13){
      setSearch(event.target.value);
      event.target.value = '';
    }
  }
  return (
    <div className="container ml-10 w-1/2 rounded bg-blue-100">
      <input type="text" placeholder="Search.."  className="text-3xl w-full" onKeyUp={(event) => searchFiles(event)} />
    </div>
  );
}

function Input({text, onEnter}): JSX.Element {
  const [isSwitched, setIsSwitched] = useState(false)

  const setCost = (event) => {
    if(event.keyCode === 13){
      handleSwitch()
    }
  }

  const handleSwitch = () => {
    setIsSwitched(!isSwitched)
  }

  if(isSwitched){
    return (
      <div className="container w-1/3 rounded bg-blue-100">
        <input type="text" placeholder="Set cost" className="text-xl w-full" onKeyUp={(event) => setCost(event)} />
      </div>
    )
  }
  return (
    <button className="bg-blue-500 hover:bg-blue-700 text-white text-xl py-2 px-4 rounded">
      Button
    </button>
  )
}

export {PageHeader, PageSubheader, Switch, VerticalSpace1, VerticalSpace2, HorizontalSpace1, HorizontalSpace2, HorizontalSpace3, BigText, HorizontalLine}