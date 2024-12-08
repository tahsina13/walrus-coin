import { useState, useRef, useEffect } from 'react'
import { PageHeader } from '../components/Components'
import { Link } from 'react-router-dom'
import FilesIcon from '../assets/file-icon.png'
import axios from 'axios'
import { ipcRenderer } from 'electron';
import { open, readFile } from 'fs'
import { useNavigate } from 'react-router-dom';
// import fs from 'browserify-fs';


function TransactionsPage(): JSX.Element {
  const [storage, set_storage] = useState("")
  const [sorting_order, set_sorting_order] = useState<String>('time')
  const [inverse, set_inverse] = useState<{time: boolean, name: boolean, size: boolean}>({time: false, name: false, size: false});
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [updateDate, setUpdateDate] = useState(true);

  const navigate = useNavigate();

  // let transactions = [];

  type Transaction = {
    hash: string
    date: string
    time: number
    category: string
    txid: string
    address: string
    toaddress: string
    fromaddress: string
    value: number
    confirmations: number
  }

  const [transactions_list, set_transactions_list] = useState<Array<Transaction>>([]);

  async function getTransactions(): Promise<Array<Transaction>> {
    // const transrpc = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "listtransactions", params: []}, {
    //   auth: {
    //     username: 'user',
    //     password: 'password'
    //   },
    //   headers: {
    //     'Content-Type': 'text/plain;',
    //   },
    // });
    // let transactions = transrpc.data.result;
    let transactions = await window.versions.getTransactions();
    // console.log(transactions_path);
    // let transactions = [];
    // fs.readFile('../../../../../backend/transactions.json', 'utf8', (err, data) => {
    //   if (err) {
    //     console.log('error reading transactions file: ' + err);
    //   }
    //     transactions = JSON.parse(data);
    //     console.log('finsihed transactinosl');
    // });
    // console.log("TRANSACTIONS: ");
    // console.log(transactions);
    let disptrans: Array<Transaction> = [];
    // console.log(trçansactions);
    for (let i=0; i<transactions.length; i++) {
      if (transactions[i].category != "generate") {
        let transaction = {
          hash: transactions[i].blockhash,
          date: new Date(transactions[i].time * 1000).toLocaleTimeString() + " " + new Date(transactions[i].time * 1000).toLocaleDateString(),
          time: transactions[i].time,
          txid: transactions[i].txid,
          category: transactions[i].category,
          address: transactions[i].address,
          toaddress: transactions[i].address,
          fromaddress: transactions[i].address,
          value: transactions[i].amount,
          confirmations: transactions[i].confirmations,
        }
        if (transaction.category == "receive") {
          transaction.toaddress = localStorage.getItem("walletaddr");
        } else if (transaction.category == "send") {
          transaction.fromaddress = localStorage.getItem("walletaddr");
        }
        if (transaction.confirmations == 0) {
          transaction.category = "pending";
        }
        console.log(transaction.date);
        disptrans.push(transaction);
      }
    }
    // console.log(transrpc);
    console.log(disptrans);
    return disptrans;
  }

  const sort_by_time = () => {
    if(sorting_order === "time")
      set_inverse({time: !inverse.time, name: inverse.name, size: inverse.size});
    set_sorting_order("time")
    if(inverse.time)
      set_transactions_list(transactions_list.sort((f2, f1) => f2.time- f1.time))
    else
      set_transactions_list(transactions_list.sort((f1, f2) => f2.time - f1.time))
  }

  const sort_by_size = () => {
    if(sorting_order === "size")
      set_inverse({time: inverse.time, name: inverse.name, size: !inverse.size});
    set_sorting_order("size")
    if(inverse.size)
      set_transactions_list(transactions_list.sort((f2, f1) => f2.value - f1.value))
    else
      set_transactions_list(transactions_list.sort((f1, f2) => f2.value - f1.value))
  }

  // const sort_by_name = () => {
  //   if(sorting_order === "name")
  //     set_inverse({time: inverse.time, name: !inverse.name, size: inverse.size});
  //   set_sorting_order("name")
  //   if(inverse.name)
  //     set_transactions_list(transactions.sort((f2, f1) => f1.name.localeCompare(f2.name)))
  //   else
  //     set_transactions_list(transactions_list.sort((f1, f2) => f1.name.localeCompare(f2.name)))
  // }

  const hiddenFileInput = useRef(null);

  const handleClick = event => {
    hiddenFileInput.current.click();
  };
  
  // const handleFileChange = event => {
  //   setSelectedFile(event.target.files[0]);
  // };

  const handleRouteSend = event => {
    navigate('/send');
  };

  function searchFiles(event){
    setSearch(event.target.value)
  }

  // function deleteFile(delete_file){
  //   set_transactions_list(transactions_list.filter(file => file.txid !== delete_file.txid))
  // }

  useEffect(() => {
    console.log("trans use effect");
    const fetchTransactions = async () => {
      try {
        const transactions = await getTransactions();
        console.log("LENGTH OF TRANSACTINOS: " + transactions.length);
        set_transactions_list(transactions);

      } catch (error) {
        console.error("error fetching data:", error);
      }
    };
    fetchTransactions();
  }, []);

  //add a file to the list
  // useEffect(() => {
  //   if (selectedFile) {
  //     if(file_list.filter(file => file.path === selectedFile.path).length > 0){
  //       return
  //     }
  //     let temp = {
  //       type: selectedFile.type,
  //       name: selectedFile.name,
  //       size: selectedFile.size,
  //       path: selectedFile.path,
  //       create_date: new Date(),
  //       // CID: generateRandomCID()
  //     }
  //     set_file_list(prevFileList => [...prevFileList, temp])
  //     setSelectedFile(null);
  //   }
  // }, [selectedFile, updateDate])

  // useEffect(() => {
  //   let timer = setInterval(() => {
  //     setUpdateDate(prevUpdateDate => !prevUpdateDate);
  //   }, 1000);
  //   return () => clearInterval(timer);
  // }, [])

  //update total file size
  // useEffect(()=>{
  //   let temp = 0;
  //   for(let x of transactions_list){
  //     temp += x.size
  //   }
  //   sort_by_time();
  //   // set_storage(formatAmountSize(temp))
  // }, [transactions_list])

  return (
    <div className="FilesPage">
      <div className="ml-10 flex items-center justify-between" 
      style={{ 
        marginBottom: '30px',
        padding: '10px 20px',
      }}>
        <PageHeader name={'Transactions'} />
          <button
            onClick={handleRouteSend}
            className="bg-yellow-900 text-white px-5 py-2 border-2 border-black rounded"
           >
            Send Coin
           </button>
      </div>
      
      <div className="container rounded" style={{width: "90%", marginLeft: "5%", marginRight: "5%", border: "1px solid black"}}>
        <input 
          id = "searchbar" 
          type="text" 
          placeholder="Search By Hash..."  
          className="text-3xl w-full" 
          onKeyUp={(event) => searchFiles(event)}
          style={{
            borderRadius: '4px',
            border: '1px solid #ccc'
          }} />
      </div>
      
      <div className="files">
        <div className="files_header">
          <div className="icon_col">Type:</div>
          <div className="hash_col">Hash:</div>
          <div className="last_modified_col" onMouseDown={() => sort_by_size()}>Amount:</div>
          <div className="size_col" onMouseDown={() => sort_by_time()}>Date:</div>
        </div>
        {/* <ul className="files_list" style={{overflow: "auto"}}> */}
        <ul>
          {/* {transactions_list.filter(file => true || file.txid.toLowerCase().includes(search.toLowerCase()) || file.address.toLowerCase().includes(search.toLowerCase())).map((file) => ( */}
          {transactions_list.map((file) => (
            // console.log("rendering txid: " + file.txid)
            <li key={file.txid} className="menu-item">
              <div className="file_row">
                <div className="icon_col">
                  {file.category}
                  {/* <img src={FilesIcon} alt={file.} className="w-10 h-10 ml-3" /> */}
                </div>
                <div className="hash_col">
                  <div style={{color: 'black', fontSize: '14px'}}>{file.txid}</div>
                  <div style={{color: 'gray', fontSize: '15px'}}>From: {file.fromaddress}</div>
                  <div style={{color: 'gray', fontSize: '15px'}}>To: {file.toaddress}</div>
                </div>
                {/* <div style={{color: 'black', fontSize: '16px'}} className="last_modified_col">{time_convert(file.time)}</div> */}
                <div className="last_modified_col">{((file.value))} WACO</div>
                {/* <div>{console.log(file.txid)}</div> */}
                <div style={{color: 'black', fontSize: '16px'}} className="size_col">{time_convert(file.time)}</div>
                {/* <div className="delete_col"> */}
                  {/* <img src={"/src/assets/trash.png"} alt="delete" className="w-10 h-10 ml-3" onClick={(e) => {e.stopPropagation();deleteFile(file)}}/> */}
                {/* </div> */}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const time_convert = (date: number) => {
  // current time
  let now: Date = new Date(date*1000);
  return now.toLocaleString();
  // date = n
  // time difference in different scales
  let diff_days: number = Math.abs(now.getTime() - date) / 864e5;
  let diff_hours: number = Math.abs(now.getTime() - date) / 36e5;
  let diff_minutes: number = Math.abs(now.getTime() - date) / 6e4;
  let diff_seconds: number = Math.abs(now.getTime() - date) / 1e3;
  // check if difference between post time and view time are within 365 days
  if(diff_days < 365) {
    // check if difference between post time and view time are within 24 hours
    if(diff_hours < 24) {
      // check if post date and view date are within 60 minutes
      if(diff_minutes < 60) {
        // check if post date and view date are within 60 seconds
        if(diff_seconds < 60) {
          return <div>
              {Math.floor(diff_seconds)} second{Math.floor(diff_seconds) > 1 || Math.floor(diff_seconds) == 0 ? "s" : ""} ago
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
    // else {
    //   return <div>
    //       {date.toLocaleString("en-us", {month: "short"})} {date.getDate()} at {date.toLocaleTimeString("en-us", {hour: "2-digit", minute: "2-digit"})}
    //   </div>;
    // }
  }
  // if difference between post time and view time are not within 365 days
  // else {
  //     return <div>
  //         {date.toLocaleString("en-us", {month: "short"})} {date.getDate()}, {date.getFullYear()} at {date.toLocaleTimeString("en-us", {hour: "2-digit", minute: "2-digit"})}
  //     </div>;
  // }
}

// const formatAmountSize = (satoshis) => {
//   if (satoshis === 0) return '0 Coin';
  
//   return (satoshis / 100000000);
  // const k = 1024; // 1 KB
  // const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  // const i = Math.floor(Math.log(satoshis) / Math.log(k));
  
  // return parseFloat((satoshis / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
// };

// function generateRandomCID(length = 46) {
//   // Base58 character set (without 0, O, I, and l to avoid confusion)
//   const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

//   let randomCID = '';
//   for (let i = 0; i < length; i++) {
//       const randomIndex = Math.floor(Math.random() * base58Chars.length);
//       randomCID += base58Chars[randomIndex];
//   }
  
//   return randomCID;
// }

export default TransactionsPage;
