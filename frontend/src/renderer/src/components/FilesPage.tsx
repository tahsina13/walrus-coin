import React, { useState } from 'react'

function FilesPage(): JSX.Element {
    const [storage, set_storage] = useState<number>(0);
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
                    sort by
                </div>
                <div className='drop_down_menu'>
                    drop down menu
                </div>
            </div>
            <div className='files'>
                <div className='files_header'>
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

export default FilesPage;