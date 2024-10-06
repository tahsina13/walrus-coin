import { useState } from 'react'
import { Link } from 'react-router-dom';

function FilesPage(): JSX.Element {
    const [storage, set_storage] = useState<number>(0);
    const [style0, set_style0] = useState<{}>({backgroundColor: "#f1e1bf", border: "none"});
    const [style1, set_style1] = useState<{}>({backgroundColor: "#f1e1bf", border: "none"});
    const [style2, set_style2] = useState<{}>({backgroundColor: "#f1e1bf", border: "none"});
    let files = [ // for testing
    {
        type: "txt",
        name: "New Text Document.txt",
        size: 10,
        path: "New-Text-Document"
    },
    {
        type: "txt",
        name: "New Text Document2.txt",
        size: 10,
        path: "New-Text-Document2"
    },
    ];
    const [file_list, set_file_list] = useState(files);
    return (
        <div className='FilesPage'>
            <div className='row_1'>
                <div className='file_storage'>
                    {storage} MB Files 
                </div>
                <button className='import_file'>
                    + Import
                </button>
            </div>
            <div className='row_2'>
                <div className='sort_by'>
                    Sort By
                </div>
                <div className="sorting_orders">
                    <button id="time" style={style0}>
                        Time
                    </button>
                    <button id="size" style={style1}>
                        Size
                    </button>
                    <button id="type" style={style2}>
                        Type
                    </button>
                </div>
            </div>
            <div className='files'>
                <div className='files_header'>
                    <div className='icon_col'>Icon:</div>
                    <div className='name_col'>Name:</div>
                    <div className='size_col'>Size:</div>
                </div>
                <ul className='files_list'>
                    {file_list.map((file, index) => (
                        <li key={index} className='menu-item'>
                            <Link to = {file.path} className='file_row'>
                                <div className='icon_col'>{file.type}</div>
                                <div className='name_col'>{file.name}</div>
                                <div className='size_col'>{file.size} KB</div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default FilesPage;

/*
function FilesPage(): JSX.Element {
    const [storage, set_storage] = useState<number>(0);
    return (
        <div className='flex flex-col'>
            <div className='flex-1 flex items-center space-x-12'>
                <div style={{backgroundColor: "#f1e1bf"}} className='text-center text-2xl px-8 py-4 ml-16 my-8 w-1/3'>
                    {storage} MB Files 
                </div>
                <button style={{backgroundColor: "#997777", color: "white"}} className='text-center text-2xl px-8 py-4 my-8 w-1/3'>
                    + Import
                </button>
            </div>
            <div className='flex-1 flex items-center'>
                <div className='text-2xl flex-0.3'>
                    sort by
                </div>
            </div>
            <div className='flex-5'>
                <div className=''>
                    <div>Name:</div>
                    <div>Size:</div>
                </div>
                <div className='files_list'>
                    files list here
                </div>
            </div>
        </div>
    );
}
    */