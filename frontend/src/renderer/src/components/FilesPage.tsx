import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import FilesIcon from '../assets/file-icon.png'
import DeleteIcon from '../assets/trash.png'
import FilePreview from './FilePreview'
import ConfirmationDialog from './ConfirmationDialog';
import axios from "axios";
import FormData from "form-data";
import { LoadingButton } from '@mui/lab';

function FilesPage(): JSX.Element {
  const [storage, set_storage] = useState('')
  const [sorting_order, set_sorting_order] = useState<String>('time')
  const [inverse, set_inverse] = useState<{ time: boolean; name: boolean; size: boolean; price: boolean }>({
    time: false,
    name: false,
    size: false,
    price: false,
  })
  const [search, setSearch] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [updateDate, setUpdateDate] = useState(true)
  const defaultFileCost = localStorage.getItem('defaultFileCost') ? parseFloat(localStorage.getItem('defaultFileCost') as string) : 1
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<ProvidedFile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  //const [fileHash, setFileHash] = useState<string>('');

  const handleCloseDialog = () => {
      setDialogOpen(false);
  };

  // File Preview
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [popoverFile, setPopoverFile] = useState<ProvidedFile | null>(null);

  const handleShowPreview = (event: React.MouseEvent<HTMLDivElement>, file: ProvidedFile) => {
    // *** currently disabled for better testing experience ***
    //setAnchorEl(event.currentTarget);
    //setPopoverFile(file);
    console.log("hi");
  };

  const handleClosePreview = () => {
    setAnchorEl(null);
  };

  const previewOpen = Boolean(anchorEl);


  type ProvidedFile = {
    type: string
    name: string
    size: number
    upload_date: Date
    path: string
    CID: string
    price: number
    fileObject: File
    status: string
  }

  const files: ProvidedFile[] = [
    // for testing
    
    {
      type: 'txt',
      name: 'A: First click UPLOAD to upload files in the waiting list',
      size: 101233,
      upload_date: new Date(20010101),
      path: "xxxpath1",
      CID: 'gmx286mbXoaWmaszRzTG4R8yvptfGCZPLdY3KoRTauSX3C',
      price: .0002,
      fileObject: new File(["0"], "1"), // dummy file object
      status: "provided"
    },
    {
      type: 'txt',
      name: 'B: Files in the waiting list doesn\'t have a hash',
      size: 100224423,
      upload_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      path: "xxxpath2",
      CID: 'zdN4U62G1FMyWVhUXSrdKSGxHDeyCDmCCCZyVgpdc58SiM',
      price: .4,
      fileObject: new File(["0"], "1"),
      status: "provided"
    },
    {
      type: 'txt',
      name: 'C: You can then actually "upload" thoes files in the waiting list by hitting "SUBMIT"',
      size: 103230,
      upload_date: new Date(Date.now() - 30 * 60 * 1000),
      path: "xxxpath3",
      CID: 'mL6VNFF1wHFhfeXbio8iGRmSc7Z9wyX5Ng1gNXacuC5Ro8',
      price: 2,
      fileObject: new File(["0"], "1"),
      status: "provided"
    },
    {
      type: 'pdf',
      name: 'D: And the hash will show up, you can check the provider in explore section',
      size: 44214,
      upload_date: new Date(Date.now() - 20 * 60 * 60 * 1000),
      path: "xxxpath4",
      CID: 'fwzPoUwFVJF8RwNiBEM9VH1rQ6EkhEJPyjfH25EKSG5FVd',
      price: .42,
      fileObject: new File(["0"], "1"),
      status: "provided"
    },
    {
      type: 'txt',
      name: 'X: sort by name to see instruction',
      size: 103230,
      upload_date: new Date(Date.now()),
      path: "xxxpath3",
      CID: 'mL6VNFF1wHFhfeXbio8iGRmSc7Z9wyX5Ng1gNXacuC5Ro8',
      price: 2,
      fileObject: new File(["0"], "1"),
      status: "provided"
    },
    
  ]
  const [file_list, set_file_list] = useState(files)

  const sort_by_time = () => {
    if (sorting_order === 'time') set_inverse({ time: !inverse.time, name: inverse.name, size: inverse.size, price: inverse.price })
    set_sorting_order('time')
    if (inverse.time) set_file_list(file_list.sort((f2, f1) => f2.upload_date.getTime() - f1.upload_date.getTime()))
    else set_file_list(file_list.sort((f1, f2) => f2.upload_date.getTime() - f1.upload_date.getTime()))
  }

  const sort_by_size = () => {
    if (sorting_order === 'size') set_inverse({ time: inverse.time, name: inverse.name, size: !inverse.size, price: inverse.price })
    set_sorting_order('size')
    if (inverse.size) set_file_list(file_list.sort((f2, f1) => f2.size - f1.size))
    else set_file_list(file_list.sort((f1, f2) => f2.size - f1.size))
  }

  const sort_by_name = () => {
    if (sorting_order === 'name') set_inverse({ time: inverse.time, name: !inverse.name, size: inverse.size, price: inverse.price })
    set_sorting_order('name')
    if (inverse.name) set_file_list(file_list.sort((f2, f1) => f1.name.localeCompare(f2.name)))
    else set_file_list(file_list.sort((f1, f2) => f1.name.localeCompare(f2.name)))
  }

  const sort_by_price = () => {
    if (sorting_order === 'price') set_inverse({ time: inverse.time, name: inverse.name, size: inverse.size, price: !inverse.price })
    set_sorting_order('price')
    if (inverse.price) set_file_list(file_list.sort((f2, f1) => f2.price - f1.price))
    else set_file_list(file_list.sort((f1, f2) => f2.price - f1.price))
  }

  const hiddenFileInput = useRef(null)

  const handleClick = () => {
    if (hiddenFileInput.current) (hiddenFileInput.current as HTMLInputElement).click()
  }

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0])
  }

  function searchFiles(event) {
    setSearch(event.target.value)
  }

  function deleteFile() {
    if (fileToDelete) {
      setDialogOpen(false);
      set_file_list(file_list.filter((file) => file.CID !== fileToDelete.CID))
    }
  }

  const handleDelete = (file: ProvidedFile) => {
    setFileToDelete(file);  // Set the file to be deleted
    setDialogOpen(true);  // Open the confirmation dialog
  };

  const handleSubmit = async () => {
    setLoading(true);
    for(let file of file_list.filter((file) => file.status !== "provided")) {
      try {
        let data = new FormData();
        //const blob = new Blob([file.fileObject], { type: file.fileObject.type });
         //console.log("blob::");
         //console.log(blob);
        data.append("data", file.fileObject);
        const response_put = await axios.post("http://localhost:5001/api/v0/block/put", data, {
          headers: {
            'Content-Type': 'multipart/form-data', // Automatically set by FormData, but added for clarity
          },
        });
        file.CID = response_put.data.Key;
         console.log("file provided:");
         console.log(file);
        const response_provide = await axios.post(`http://localhost:5001/api/v0/routing/provide?arg=${file.CID}`);
        file.status = "provided";
      } catch (error) {
        console.error("Error during API request:", error);
        setLoading(false);
        return;
      } finally {
        files.splice(files.indexOf(file), 1);
      }
    }
    setLoading(false);
  }

  //add a file to the list
  useEffect(() => {
    if (selectedFile) {
      if (file_list.filter((file) => file.path === selectedFile.path).length > 0) {
        return
      }
      let temp: ProvidedFile = {
        type: selectedFile.type,
        name: selectedFile.name,
        size: selectedFile.size,
        upload_date: new Date(),
        path: selectedFile.path,
        CID: "",
        price: defaultFileCost,
        fileObject: selectedFile,
        status: "readyToProvide"
      }
      set_file_list((prevFileList) => [temp, ...prevFileList])
       console.log("File uploaded:");
       console.log(temp);
      setSelectedFile(null)
    }
  }, [selectedFile, updateDate])

  useEffect(() => {
    let timer = setInterval(() => {
      setUpdateDate((prevUpdateDate) => !prevUpdateDate)
    }, 1000)
    sort_by_time()
    return () => clearInterval(timer)
  }, [])

  //update total file size
  useEffect(() => {
    let temp = 0
    for (let x of file_list) {
      temp += x.size
    }
    set_storage(formatFileSize(temp))
  }, [file_list])

  return (
    <div className="FilesPage">
      <div className="row_1">
        <div className="file_storage">Total File Size: {storage}</div>
        <input type="file" onChange={handleFileChange} ref={hiddenFileInput} style={{ display: 'none' }} />
        <button className="import_file" onClick={handleClick}>
          UPLOAD
        </button>
        <LoadingButton 
          loading={loading}
          variant="contained"
          color="primary"
          className="import_file"
          onClick={handleSubmit}
          loadingPosition="end"
          endIcon={null}>
          SUBMIT
        </LoadingButton>
      </div>

      <div
        className="container rounded"
        style={{
          width: '90%',
          marginLeft: '5%',
          marginRight: '5%',
          border: '1px solid black',
        }}
      >
        <input id="searchbar" type="text" placeholder="Search.." className="text-3xl w-full" onKeyUp={(event) => searchFiles(event)} />
      </div>

      <div className="files">
        <div className="files_header">
          <div className="icon_col"></div>
          <div className="name_col" onMouseDown={() => sort_by_name()}>
            Name
          </div>
          <div className="price_col" onMouseDown={() => sort_by_price()}>
            Price (WACO)
          </div>
          <div className="last_modified_col" onMouseDown={() => sort_by_time()}>
            Upload Date
          </div>
          <div className="size_col" onMouseDown={() => sort_by_size()}>
            Size
          </div>
          <div className="delete_col"></div>
        </div>
        <ul className="files_list">
          {file_list
            .filter((file) => file.name.toLowerCase().includes(search.toLowerCase()) || file.CID.toLowerCase().includes(search.toLowerCase()))
            .map((file, index) => (
              <li key={index} className="menu-item">
                <div className="file_row" onClick={(e) => handleShowPreview(e, file)}>
                  <div className="icon_col">
                    <img src={FilesIcon} alt={file.type} className="w-10 h-10 ml-3" />
                  </div>
                  <div className="name_col">
                    <div>{file.name}</div>
                    <div style={{ color: 'gray', fontSize: '15px', }}>{file.CID !== "" ? file.CID : "Ready to provide"}</div>
                  </div>
                  <div className="price_col">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        style={{
                          width: '100%',
                          minWidth: '50px',
                          textAlign: 'left',
                        }}
                        type="number"
                        value={file.price}
                        onChange={(e) => {
                          // prettier-ignore
                          if(file.status !== "provided")
                            set_file_list(file_list.map(f => f.CID === file.CID ? { ...f, price: Math.min(9999, Math.max(0, isNaN(parseFloat(e.target.value)) ? 0 : parseFloat(e.target.value))) } : f));
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {/* prettier-ignore */}
                    </div>
                  </div>
                  <div className="last_modified_col">{time_convert(file.upload_date)}</div>
                  <div className="size_col">{formatFileSize(file.size)}</div>
                  <div className="delete_col">
                    {file.status === "readyToProvide"&&<img
                      src={DeleteIcon}
                      alt="delete"
                      className="w-10 h-10 ml-3"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(file)
                      }}
                    />}
                  </div>
                </div>
              </li>
            ))}
        </ul>
      </div>
      <FilePreview
        open={Boolean(anchorEl)} 
        anchorEl={anchorEl}
        onClose={handleClosePreview}
        file={popoverFile}
       >
       </FilePreview>
       <ConfirmationDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          onConfirm={deleteFile}
          title="Delete File?"
          message={`Are you sure you want to delete the file "${fileToDelete?.name}"? It will be gone forever!`}
        />
    </div>
  )
}

const time_convert = (date: Date) => {
  // current time
  let now: Date = new Date()
  date = new Date(date)
  // time difference in different scales
  let diff_days: number = Math.abs(now.getTime() - date.getTime()) / 864e5
  let diff_hours: number = Math.abs(now.getTime() - date.getTime()) / 36e5
  let diff_minutes: number = Math.abs(now.getTime() - date.getTime()) / 6e4
  let diff_seconds: number = Math.abs(now.getTime() - date.getTime()) / 1e3
  // check if difference between post time and view time are within 365 days
  if (diff_days < 365) {
    // check if difference between post time and view time are within 24 hours
    if (diff_hours < 24) {
      // check if post date and view date are within 60 minutes
      if (diff_minutes < 60) {
        // check if post date and view date are within 60 seconds
        if (diff_seconds < 60) {
          return (
            <div>
              {Math.floor(diff_seconds)} second
              {Math.floor(diff_seconds) > 1 || Math.floor(diff_seconds) == 0 ? 's' : ''} ago
            </div>
          )
        }
        // if difference between post time and view time are not within 60 seconds
        else {
          return (
            <div>
              {Math.floor(diff_minutes)} minute
              {Math.floor(diff_minutes) > 1 ? 's' : ''} ago
            </div>
          )
        }
      }
      // if difference between post time and view time are not within 60 minutes
      else {
        return (
          <div>
            {Math.floor(diff_hours)} hour{Math.floor(diff_hours) > 1 ? 's' : ''} ago
          </div>
        )
      }
    }
    // if difference between post time and view time are not within 24 hours
    else {
      return (
        <div>
          {date.toLocaleString('en-us', { month: 'short' })} {date.getDate()} at{' '}
          {date.toLocaleTimeString('en-us', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )
    }
  }
  // if difference between post time and view time are not within 365 days
  else {
    return (
      <div>
        {date.toLocaleString('en-us', { month: 'short' })} {date.getDate()}, {date.getFullYear()} at{' '}
        {date.toLocaleTimeString('en-us', { hour: '2-digit', minute: '2-digit' })}
      </div>
    )
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024 // 1 KB
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function generateRandomCID(length = 46) {
  // Base58 character set (without 0, O, I, and l to avoid confusion)
  const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

  let randomCID = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * base58Chars.length)
    randomCID += base58Chars[randomIndex]
  }

  return randomCID
}

export default FilesPage
