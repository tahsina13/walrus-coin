import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import FilesIcon from '../assets/file-icon.png'

function FilesPage(): JSX.Element {
  const [storage, set_storage] = useState<number>(0)
  const [sorting_order, set_sorting_order] = useState<String>('time')
  const [inverse, set_inverse] = useState<{time: boolean, name: boolean, size: boolean}>({time: false, name: false, size: false});
  const [search, setSearch] = useState('');
  let files = [
    // for testing
    {
      type: 'txt',
      name: 'XNew Text Document.txt',
      size: 10,
      path: 'ANew-Text-Document',
      create_date: new Date(20010101)
    },
    {
      type: 'txt',
      name: 'BNew Text Document2.txt',
      size: 100,
      path: 'BNew-Text-Document2',
      create_date: new Date()
    },
    {
      type: 'txt',
      name: 'CNew Text Document2.txt',
      size: 100,
      path: 'BNew-Text-Document2',
      create_date: new Date()
    },
    {
      type: 'txt',
      name: 'DNew Text Document2.txt',
      size: 10000,
      path: 'BNew-Text-Document2',
      create_date: new Date()
    },
    {
      type: 'txt',
      name: 'ENew Text Document2.txt',
      size: 100,
      path: 'BNew-Text-Document2',
      create_date: new Date()
    },
    {
      type: 'txt',
      name: 'KNew Text Document2.txt',
      size: 1000,
      path: 'BNew-Text-Document2',
      create_date: new Date()
    },
    {
      type: 'txt',
      name: 'ASNew Text Document2.txt',
      size: 1001,
      path: 'BNew-Text-Document2',
      create_date: new Date()
    },
    {
      type: 'txt',
      name: 'CCCNew Text Document2.txt',
      size: 100,
      path: 'BNew-Text-Document2',
      create_date: new Date()
    },
    {
      type: 'txt',
      name: 'ZNew Text Document2.txt',
      size: 100,
      path: 'BNew-Text-Document2',
      create_date: new Date()
    }
  ]
  const [file_list, set_file_list] = useState(files)

  const sort_by_time = () => {
    if(sorting_order === "time")
      set_inverse({time: !inverse.time, name: inverse.name, size: inverse.size});
    set_sorting_order("time")
    if(inverse.time)
      set_file_list(file_list.sort((f2, f1) => f2.create_date.getTime() - f1.create_date.getTime()))
    else
      set_file_list(file_list.sort((f1, f2) => f2.create_date.getTime() - f1.create_date.getTime()))
  }

  const sort_by_size = () => {
    if(sorting_order === "size")
      set_inverse({time: inverse.time, name: inverse.name, size: !inverse.size});
    set_sorting_order("size")
    if(inverse.size)
      set_file_list(file_list.sort((f2, f1) => f2.size - f1.size))
    else
      set_file_list(file_list.sort((f1, f2) => f2.size - f1.size))
  }

  const sort_by_name = () => {
    if(sorting_order === "name")
      set_inverse({time: inverse.time, name: !inverse.name, size: inverse.size});
    set_sorting_order("name")
    if(inverse.name)
      set_file_list(file_list.sort((f2, f1) => f1.name.localeCompare(f2.name)))
    else
      set_file_list(file_list.sort((f1, f2) => f1.name.localeCompare(f2.name)))
  }

  const hiddenFileInput = useRef(null);

  const handleClick = event => {
    hiddenFileInput.current.click();
  };

  const handleFileChange = event => {
    alert(event.target.files[0]) //TODO upload
  };

  return (
    <div className="FilesPage">
      <div className="row_1">
        <div className="file_storage">{storage} MB Files</div>
        <input type="file" onChange={handleFileChange} ref={hiddenFileInput} style={{display: 'none'}} />
        <button className="import_file" onClick={handleClick}>
          Upload
        </button>
      </div>
      <SearchBar setSearch={setSearch} />
      <div className="files">
        <div className="files_header">
          <div className="icon_col"></div>
          <div className="name_col" onMouseDown={() => sort_by_name()}>Name:</div>
          <div className="last_modified_col" onMouseDown={() => sort_by_time()}>Last Modified:</div>
          <div className="size_col" onMouseDown={() => sort_by_size()}>Size:</div>
        </div>
        <ul className="files_list">
          {file_list.map((file, index) => (
            <li key={index} className="menu-item">
              <Link to={file.path} className="file_row">
                <div className="icon_col">
                  <img src={FilesIcon} alt={file.type} className="w-10 h-10 ml-3" />
                </div>
                <div className="name_col">{file.name}</div>
                <div className="last_modified_col">{time_convert(file.create_date)}</div>
                <div className="size_col">{file.size} KB</div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SearchBar({setSearch}): JSX.Element {
  const searchFile = (event) => {
    if(event.keyCode === 13){
      setSearch(event.target.value);
      event.target.value = '';
    }
  }
  return (
    <div className="container ml-10 w-1/2 rounded bg-blue-100">
      <input id = "searchbar" type="text" placeholder="Search.."  className="text-3xl w-full" onKeyUp={(event) => searchFiles(event)} />
    </div>
  );
}

function searchFiles(event): null{
  return null
}

const time_convert = (date: Date) => {
  // current time
  let now: Date = new Date();
  date = new Date(date);
  // time difference in different scales
  let diff_days: number = Math.abs(now.getTime() - date.getTime()) / 864e5;
  let diff_hours: number = Math.abs(now.getTime() - date.getTime()) / 36e5;
  let diff_minutes: number = Math.abs(now.getTime() - date.getTime()) / 6e4;
  let diff_seconds: number = Math.abs(now.getTime() - date.getTime()) / 1e3;
  // check if difference between post time and view time are within 365 days
  if(diff_days < 365) {
    // check if difference between post time and view time are within 24 hours
    if(diff_hours < 24) {
      // check if post date and view date are within 60 minutes
      if(diff_minutes < 60) {
        // check if post date and view date are within 60 seconds
        if(diff_seconds < 60) {
          return <div>
              {Math.floor(diff_seconds)} second{Math.floor(diff_seconds) > 1 ? "s" : ""} ago
          </div>;
        }
        // if difference between post time and view time are not within 60 seconds
        else {
          return <div>
              {Math.floor(diff_minutes)} minute{Math.floor(diff_minutes) > 1 ? "s" : ""} ago
          </div>;
        }
      }
      // if difference between post time and view time are not within 60 minutes
      else {
          return <div>
              {Math.floor(diff_hours)} hour{Math.floor(diff_hours) > 1 ? "s" : ""} ago
          </div>;
      }
    }
    // if difference between post time and view time are not within 24 hours
    else {
      return <div>
          {date.toLocaleString("en-us", {month: "short"})} {date.getDate()} at {date.toLocaleTimeString("en-us", {hour: "2-digit", minute: "2-digit"})}
      </div>;
    }
  }
  // if difference between post time and view time are not within 365 days
  else {
      return <div>
          {date.toLocaleString("en-us", {month: "short"})} {date.getDate()}, {date.getFullYear()} at {date.toLocaleTimeString("en-us", {hour: "2-digit", minute: "2-digit"})}
      </div>;
  }
}

export default FilesPage;
