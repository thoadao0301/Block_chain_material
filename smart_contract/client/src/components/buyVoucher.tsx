import {Button} from '@material-ui/core';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, TransactionSignature, PublicKey, SystemProgram, AccountMeta, TransactionInstruction } from '@solana/web3.js';
import {FC, useCallback} from "react";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
const programID = new PublicKey("8XsEwyf1VfrTi2fUcRoPaHhXs5W8Yznfha19vX961ZCx")

const InitCampaign: FC = () => {
    const { connection } = useConnection()
    const {publicKey, sendTransaction} = useWallet();

    const onClick = useCallback(async () => {
        if(!publicKey){
            console.log("fail")
            return
        }
        let signature: TransactionSignature = ''
        try {
            let voucherPubKey = new PublicKey("")
            const transaction = new Transaction()
            transaction.add(

            )
            signature = await sendTransaction(transaction, connection);
            console.log('info', 'Transaction sent:', signature);

            await connection.confirmTransaction(signature, 'processed');
            console.log('success', 'Transaction successful!', signature);
        } catch (error: any) {
            console.log('error', `Transaction failed! ${error?.message}`, signature);
            return;
        }
    }, [publicKey, connection, sendTransaction]);

    return (
        <div>
            <h1> App </h1>
            <WalletMultiButton />
            <Button variant="contained" color="secondary" onClick={onClick} disabled={!publicKey}>
            Init Campaign
            </Button>
        </div>
    )
}
export default InitCampaign;