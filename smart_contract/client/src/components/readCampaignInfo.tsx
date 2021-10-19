import {Button} from '@material-ui/core';
import { useConnection } from '@solana/wallet-adapter-react';
import {  PublicKey } from '@solana/web3.js';
import {FC, useCallback} from "react";
import {readInfo} from './utils'

const ReadCampaign: FC = () => {
    const { connection } = useConnection()
    const camPubkey = new PublicKey('GAg5w7ucJUHNNoPTM3s8uRTBKCCE4P96sM2SHBpx4bUM')
    const onClick = useCallback(async () => {
        try{
            let CamInfo = readInfo(camPubkey,connection)
        }catch(error: any){
            console.log('error: ', `${error?.message}`)
            return
        }
    },[connection]);
    return (
        <div>
            <h1> App </h1>
            <Button variant="contained" color="secondary" onClick={onClick}>
            Campaign information
            </Button>
        </div>
    )
}
export default ReadCampaign;