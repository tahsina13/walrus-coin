import React, { useState } from 'react'

function StandardSpace(): JSX.Element {
    return(<div className="mt-10"></div>)
}

function PageHeader({name}): JSX.Element {
    return(<div className="text-4xl mt-10"> {name} </div>)
  }

function Switch({text, onClick}): JSX.Element {
  const [isChecked, setIsChecked] = useState(false)

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked)
  }

  const checkedClassName="translate-x-10"
  const checkedBGClassName="bg-green-600"
  return (
    <>
    <div className='flex flex-row'>
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
    </>
  )
}

export {PageHeader, Switch, StandardSpace}