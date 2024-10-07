import { useState } from 'react'
import { Link } from 'react-router-dom';
import FilesIcon from '../assets/file-icon.png';

function FilesPage(): JSX.Element {
    const [storage, set_storage] = useState<number>(0);
    const [style0, set_style0] = useState<{}>({backgroundColor: "#997777", border: "none"});
    const [style1, set_style1] = useState<{}>({backgroundColor: "#f1e1bf", border: "none"});
    const [style2, set_style2] = useState<{}>({backgroundColor: "#f1e1bf", border: "none"});
    const [sorting_order, set_sorting_order] = useState<String>("time");
    let files = [ // for testing
    {
        type: "txt",
        name: "ANew Text Document.txt",
        size: 10,
        path: "ANew-Text-Document",
        create_date: new Date(),
    },
    {
        type: "txt",
        name: "BNew Text Document2.txt",
        size: 100,
        path: "BNew-Text-Document2",
        create_date: new Date(),
    },
    ];
    const [file_list, set_file_list] = useState(files);
    
    
    const sort_by_time = () => {
        set_style0({backgroundColor: "#997777"});
        set_style1({backgroundColor: "#f1e1bf"});
        set_style2({backgroundColor: "#f1e1bf"});
        set_file_list(file_list.sort((f1, f2) => f2.create_date.getTime() - f1.create_date.getTime()));
    }

    const sort_by_size = () => {
        set_style0({backgroundColor: "#f1e1bf"});
        set_style1({backgroundColor: "#997777"});
        set_style2({backgroundColor: "#f1e1bf"});
        set_file_list(file_list.sort((f1, f2) => f2.size - f1.size));
    }

    const sort_by_name = () => {
        set_style0({backgroundColor: "#f1e1bf"});
        set_style1({backgroundColor: "#f1e1bf"});
        set_style2({backgroundColor: "#997777"});
        set_file_list(file_list.sort((f1, f2) => f1.name.localeCompare(f2.name)));
    }



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
            <div className='files'>
                <div className='files_header'>
                    <div className='icon_col'></div>
                    <div className='name_col'>Name:</div>
                    <div className='size_col'>Size:</div>
                </div>
                <ul className='files_list'>
                    {file_list.map((file, index) => (
                        <li key={index} className='menu-item'>
                            <Link to = {file.path} className='file_row'>
                                <div className='icon_col'><img src={FilesIcon} alt={file.type} className='w-10 h-10 ml-3'/></div>
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