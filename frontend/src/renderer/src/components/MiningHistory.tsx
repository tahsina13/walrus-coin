import { useState, useEffect } from 'react'
import { PageHeader } from './Components'
import { useNavigate } from 'react-router-dom';

function MiningHistory(): JSX.Element {
    const [minedBlocks, setMinedBlocks] = useState<Array<MinedBlock>>([]);
    const [mineCount, setMineCount] = useState<Number>(0);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    type MinedBlock = {
        hash: string
        date: string
    }
    useEffect(() => {
        fetchTransactions();
      }, []);

    async function getTransactions(): Promise<Array<MinedBlock>> {
        let transactions = await window.versions.getTransactions();
        let translist: Array<MinedBlock> = [];
        let mineCount = 0
        for (let i=0; i<transactions.length; i++) {
          if (transactions[i].category == "generate") {
            let minedBlock = {
              hash: transactions[i].blockhash,
              date: new Date(transactions[i].time * 1000).toLocaleTimeString() + " " + new Date(transactions[i].time * 1000).toLocaleDateString(),
            }
            translist.push(minedBlock);
            mineCount += 1;
            // if (mineCount >= 5) {
            //   break;
            // }
          }
        }
        return {translist, mineCount};
    }

    const fetchTransactions = async () => {
        try {
          const {translist, mineCount} = await getTransactions();
          setMinedBlocks(translist);
          setMineCount(mineCount)
        } catch (error) {
            console.error('Error fetching data:', error);
        }     
    };

    return (
        <div className="FilesPage">
        <div className="ml-10 flex items-center justify-between" 
        style={{ 
            marginBottom: '30px',
            padding: '10px 20px',
        }}>
            <PageHeader name={'Mining History'}/>
        </div>
        
        <div className="files ml-2">
            <div className="files_header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="hash_col" style={{ flex: 1 }}>Hash</div>
                <div className="amount_col" style={{ flex: 1 }}>Amount</div>
                <div className="date_col" style={{ flex: 1 }}>Date</div>
            </div>
            <ul style={{ height: '90%', overflowY: 'auto' }}>
                {minedBlocks.map((item) => (
                <li key={item.hash} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}> 
                        Block {item.hash.substring(0, 5) + '-' + item.hash.substring(item.hash.length-5, item.hash.length)}
                    </div>
                    <div style={{ flex: 1 }}> 50 </div>
                    <div style={{ flex: 1 }}> {item.date}  </div>
                </li>
                ))}
            </ul>
        </div>
        <div className='mt-10 mb-10 ml-2 text-2xl'> Mined {mineCount} blocks in total equaling {50*mineCount} WACO  </div>
        <div className="ml-4 m-2">
            <button 
              className="text-white px-4 py-2 rounded" 
              style={{ backgroundColor: '#997777' }}
              onClick={() => navigate('/mining')}
            >
              Back
            </button>
          </div>
        </div>
    );
}

export default MiningHistory