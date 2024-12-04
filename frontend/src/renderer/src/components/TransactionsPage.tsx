import { useState, useRef, useEffect } from 'react'
import { PageHeader } from '../components/Components'
import { Link } from 'react-router-dom'
import FilesIcon from '../assets/file-icon.png'


function TransactionsPage(): JSX.Element {
  const [storage, set_storage] = useState("")
  const [sorting_order, set_sorting_order] = useState<String>('time')
  const [inverse, set_inverse] = useState<{time: boolean, name: boolean, size: boolean}>({time: false, name: false, size: false});
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [updateDate, setUpdateDate] = useState(true);
  let transactions = [
    // for testing
    {
      "txid": "d50cb97c743bf7ba163eb52d4fce8489ce622b0f889b45e3c2151d53654415dd",
      "category": "Sent",
      "size": 360,
      "version": 2,
      "locktime": 0,
      "fee": 768,
      "inputs": [
        {
          "coinbase": false,
          "txid": "f2ae6dfbd9f9421597fcb883ede0b959e967c2bb3a24948f1fdf5825703a1b98",
          "output": 0,
          "sigscript": "",
          "sequence": 4294967293,
          "pkscript": "5120338cd11f2101423d43d0d5f33162d1e5f73f5a3f546147cbfdbacf9087b92c5b",
          "value": 1314,
          "address": "bc1pxwxdz8epq9pr6s7s6henzck3uhmn7k3l23s50jlaht8eppae93dsc7zf72",
          "witness": [
            "adb55b2c15eb02daa78a7c8087609aa0c08acdd746d441aaa50ce043dc9b95c51c7b59ecbc6c0e26211a8282f8cc8e3faf87c171351ae9e34b1a717d9679362f",
            "200315640738ad7b5ebd9a4d857d87a3fba23c034007d62ed39b33458b90b78accac0063036f7264010118746578742f706c61696e3b636861727365743d7574662d38004c5c7b2270223a226272632d3230222c226f70223a226465706c6f79222c227469636b223a22517366674b222c226c696d223a2231303030222c226d6178223a223231303030303030222c2273656c665f6d696e74223a2274727565227d68",
            "c10315640738ad7b5ebd9a4d857d87a3fba23c034007d62ed39b33458b90b78acc"
          ]
        }
      ],
      "outputs": [
        {
          "address": "bc1pk5en4904566s5qgz2k0zvmg85uc8u8q46ftgfxhwm2540vwqe72slkjzp8",
          "pkscript": "5120b5333a95f5a6b50a0102559e266d07a7307e1c15d256849aeedaa957b1c0cf95",
          "value": 546,
          "spent": false,
          "spender": null
        }
      ],
      "block": {
        "height": 866460,
        "position": 2106
      },
      "deleted": false,
      "time": 1729399057,
      "rbf": false,
      "weight": 642
    },
    {
      "txid": "577c817821249072a2f4db204129a9604999b1b5d22809a7f3f2dc903515d571",
      "category": "Sent",
      "size": 653,
      "version": 2,
      "locktime": 0,
      "fee": 5850,
      "inputs": [
        {
          "coinbase": false,
          "txid": "95c913e11c9b0664a48232aa7fd221110038c79f1bc9fa057250dd3f4b9caad5",
          "output": 4,
          "sigscript": "",
          "sequence": 4294967295,
          "pkscript": "5120cedf80e0c13c3192ca9dc991cf1cfd2417a655ce5c00b92475ff419be5a1c7f8",
          "value": 6396,
          "address": "bc1pem0cpcxp8sce9j5aexgu788ayst6v4wwtsqtjfr4laqehedpcluq2duj55",
          "witness": [
            "21a8bed6aeaacb53df760a5fd3bcf50d6ef1bc07e3aea8d2e632666a27977a5cc90ee4d32ddc8474965484a2ef384b6ee2b4070084fbdb75ff65d64735b17677",
            "20ff7e98e114eb7d80e40d3f061907a88d5a360d69fa2ce50da4b59a6637463d54ac0063036f7264010117746578742f68746d6c3b636861727365743d7574662d38004d7f013c21444f43545950452068746d6c3e0a3c68746d6c206c616e673d22656e223e0a20203c686561643e0a202020203c6d65746120636861727365743d225554462d3822202f3e0a202020203c6d657461206e616d653d2276696577706f72742220636f6e74656e743d2277696474683d6465766963652d77696474682c20696e697469616c2d7363616c653d312e3022202f3e0a202020203c7469746c653e6469616465706978616c65733c2f7469746c653e0a20203c2f686561643e0a20203c626f6479207374796c653d226d617267696e3a20307078223e0a202020203c6469763e0a2020202020203c696d67207374796c653d2277696474683a313030253b6d617267696e3a30707822207372633d222f636f6e74656e742f36383162353337336330336533663831393233316166643932323766353431303133393532393963396535383335366264613237386532663332626566326364693022202f3e0a202020203c2f6469763e0a20203c2f626f64793e0a3c2f68746d6c3e68",
            "c0ff7e98e114eb7d80e40d3f061907a88d5a360d69fa2ce50da4b59a6637463d54"
          ]
        }
      ],
      "outputs": [
        {
          "address": "bc1pegh5cgn0qpk2v43w0k7wa03qfr2wcsfvlyqa3eygqwydh3mfeuvsexpkad",
          "pkscript": "5120ca2f4c226f006ca6562e7dbceebe2048d4ec412cf901d8e4880388dbc769cf19",
          "value": 546,
          "spent": false,
          "spender": null
        }
      ],
      "block": {
        "height": 834521,
        "position": 2349
      },
      "deleted": false,
      "time": 1710340322,
      "rbf": false,
      "weight": 935
    },
    {
      "txid": "fb323ce23a3b91339a635019fed9df91ea1df055823cdb85a7bae27c82a774c9",
      "category": "Received",
      "size": 192,
      "version": 2,
      "locktime": 0,
      "fee": 403,
      "inputs": [
        {
          "coinbase": false,
          "txid": "8b98c23ef414e775bd86920eb6207ba432dee703b0455846b4779e81b120bfc4",
          "output": 1,
          "sigscript": "",
          "sequence": 4294967293,
          "pkscript": "0014c7ba277083afa9595b63b36a3c88f9f5bc5f8f63",
          "value": 20058207,
          "address": "bc1qc7azwuyr4754jkmrkd4rez8e7k79lrmrr6tyhu",
          "witness": [
            "3045022100bd2a9ad0558289887270ab620314afe552a451215117f6ab9b8afd4de035419d02204eedf6452120dff2aa855f6aa4a7de54075438de2a1f2d805168dc3c4e771fcc01",
            "03255abeb8edb42a10433cd16b0b8f83179340140671a3627cd9b901743a1f69c0"
          ]
        }
      ],
      "outputs": [
        {
          "address": "bc1qhyqc8lpeuqg3z8xmws3aqgwdtaqcg2zde68z3r",
          "pkscript": "0014b90183fc39e011111cdb7423d021cd5f4184284d",
          "value": 20057804,
          "spent": false,
          "spender": null
        }
      ],
      "block": {
        "height": 866553,
        "position": 381
      },
      "deleted": false,
      "time": 1729443651,
      "rbf": false,
      "weight": 438
    },
    {
      "txid": "d7734bbbf8b081de3e3dbb0af613887d1198b134f46a0e4a79551c968b5b587b",
      "category": "Sent",
      "size": 191,
      "version": 1,
      "locktime": 0,
      "fee": 264,
      "inputs": [
        {
          "coinbase": false,
          "txid": "1e59fa9d35d8cefe1728b573c802c2ffc2df49806cebaa15b48742a60a78d57a",
          "output": 0,
          "sigscript": "",
          "sequence": 4294967295,
          "pkscript": "0014cdcd47a0acbe1c439fa7109ac9bcf5fc155a3bdc",
          "value": 30000000,
          "address": "bc1qehx50g9vhcwy88a8zzdvn084ls245w7uwr3y08",
          "witness": [
            "3044022069b1d268ccc3c30c1bcd8a35f44ed9724f59f3692bdf9141741306301a3f2b7402203eaf7860e19e5d20643206f2a05302564d71881efc545dbfb4efe6f636a3ff3301",
            "039a99326cd736546e7e3ce1b2307c969a9da7761e7195c7074696a678388d10b7"
          ]
        }
      ],
      "outputs": [
        {
          "address": "bc1qrmqws3dklf6ddtzfgwm96tquhxcz9eq4trvksw",
          "pkscript": "00141ec0e845b6fa74d6ac4943b65d2c1cb9b022e415",
          "value": 29999736,
          "spent": false,
          "spender": null
        }
      ],
      "block": {
        "height": 866553,
        "position": 581
      },
      "deleted": false,
      "time": 1729443568,
      "rbf": false,
      "weight": 437
    },
  ]
  const [transactions_list, set_transactions_list] = useState(transactions)

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
      set_transactions_list(transactions_list.sort((f2, f1) => f2.inputs[0].value - f1.inputs[0].value))
    else
      set_transactions_list(transactions_list.sort((f1, f2) => f2.inputs[0].value - f1.inputs[0].value))
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
  
  const handleFileChange = event => {
    setSelectedFile(event.target.files[0]);
  };

  function searchFiles(event){
    setSearch(event.target.value)
  }

  function deleteFile(delete_file){
    set_transactions_list(transactions_list.filter(file => file.txid !== delete_file.txid))
  }

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
  useEffect(()=>{
    let temp = 0;
    for(let x of transactions_list){
      temp += x.size
    }
    sort_by_time();
    // set_storage(formatAmountSize(temp))
  }, [transactions_list])

  return (
    <div className="FilesPage">
      <div className="ml-10" style={{ marginBottom: '30px' }}>
        <PageHeader name={'Transactions'}  />
        {/* <div className="file_storage">Total File Size: {storage}</div> */}
        <input type="file" onChange={handleFileChange} ref={hiddenFileInput} style={{display: 'none'}} />
        {/* <button className="import_file" onClick={handleClick}>
          Upload
        </button> */}
      </div>
      
      <div className="container rounded" style={{width: "90%", marginLeft: "5%", marginRight: "5%", border: "1px solid black"}}>
        <input id = "searchbar" type="text" placeholder="Search By Hash..."  className="text-3xl w-full" onKeyUp={(event) => searchFiles(event)} />
      </div>
      
      <div className="files">
        <div className="files_header">
          <div className="icon_col">Type:</div>
          <div className="hash_col">Hash:</div>
          <div className="last_modified_col" onMouseDown={() => sort_by_size()}>Amount:</div>
          <div className="size_col" onMouseDown={() => sort_by_time()}>Date:</div>
          {/* <div className="delete_col"></div> */}
        </div>
        <ul className="files_list">
          {transactions_list.filter(file => file.txid.toLowerCase().includes(search.toLowerCase()) || file.outputs[0].address.toLowerCase().includes(search.toLowerCase())).map((file, index) => (
            <li key={index} className="menu-item">
              <div className="file_row">
                <div className="icon_col">
                  {file.category}
                  {/* <img src={FilesIcon} alt={file.} className="w-10 h-10 ml-3" /> */}
                </div>
                <div className="hash_col">
                  <div style={{color: 'black', fontSize: '14px'}}>{file.txid}</div>
                  <div style={{color: 'gray', fontSize: '15px'}}>From: {file.inputs[0].address}</div>
                  <div style={{color: 'gray', fontSize: '15px'}}>To: {file.outputs[0].address}</div>
                </div>
                {/* <div style={{color: 'black', fontSize: '16px'}} className="last_modified_col">{time_convert(file.time)}</div> */}
                <div className="last_modified_col">{formatAmountSize((file.outputs[0].value))} WACO</div>
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

const formatAmountSize = (satoshis) => {
  if (satoshis === 0) return '0 Coin';
  
  return (satoshis / 100000000);
  // const k = 1024; // 1 KB
  // const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  // const i = Math.floor(Math.log(satoshis) / Math.log(k));
  
  // return parseFloat((satoshis / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

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
