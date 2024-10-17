import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import FilesIcon from '../assets/file-icon.png'

function FilesPage(): JSX.Element {
  const [storage, set_storage] = useState<number>(0)
  const [style0, set_style0] = useState<{}>({ backgroundColor: '#997777', border: 'none' })
  const [style1, set_style1] = useState<{}>({ backgroundColor: '#f1e1bf', border: 'none' })
  const [style2, set_style2] = useState<{}>({ backgroundColor: '#f1e1bf', border: 'none' })
  const [sorting_order, set_sorting_order] = useState<String>('time')
  const [search, setSearch] = useState('');
  let files = [
    // for testing
    {
      type: 'txt',
      name: 'ANew Text Document.txt',
      size: 10,
      path: 'ANew-Text-Document',
      create_date: new Date()
    },
    {
      type: 'txt',
      name: 'BNew Text Document2.txt',
      size: 100,
      path: 'BNew-Text-Document2',
      create_date: new Date()
    }
  ]
  const [file_list, set_file_list] = useState(files)

  const sort_by_time = () => {
    set_style0({ backgroundColor: '#997777' })
    set_style1({ backgroundColor: '#f1e1bf' })
    set_style2({ backgroundColor: '#f1e1bf' })
    set_file_list(file_list.sort((f1, f2) => f2.create_date.getTime() - f1.create_date.getTime()))
  }

  const sort_by_size = () => {
    set_style0({ backgroundColor: '#f1e1bf' })
    set_style1({ backgroundColor: '#997777' })
    set_style2({ backgroundColor: '#f1e1bf' })
    set_file_list(file_list.sort((f1, f2) => f2.size - f1.size))
  }

  const sort_by_name = () => {
    set_style0({ backgroundColor: '#f1e1bf' })
    set_style1({ backgroundColor: '#f1e1bf' })
    set_style2({ backgroundColor: '#997777' })
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
      <div className="row_2">
        <div className="sort_by">Sort By</div>
        <div className="sorting_orders">
          <button id="type" style={style2} onMouseDown={() => sort_by_name()}>
            Name
          </button>
          <button id="size" style={style1} onMouseDown={() => sort_by_size()}>
            Size
          </button>
          <button id="time" style={style0} onMouseDown={() => sort_by_time()}>
            Time
          </button>
        </div>
      </div>
      <SearchBar setSearch={setSearch} />
      <div className="files">
        <div className="files_header">
          <div className="icon_col"></div>
          <div className="name_col">Name:</div>
          <div className="size_col">Size:</div>
        </div>
        <ul className="files_list">
          {file_list.map((file, index) => (
            <li key={index} className="menu-item">
              <Link to={file.path} className="file_row">
                <div className="icon_col">
                  <img src={FilesIcon} alt={file.type} className="w-10 h-10 ml-3" />
                </div>
                <div className="name_col">{file.name}</div>
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

export default FilesPage;
