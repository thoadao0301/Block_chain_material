import {Button} from '@material-ui/core';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, TransactionSignature, PublicKey, SystemProgram, AccountMeta, TransactionInstruction } from '@solana/web3.js';
import {FC, useCallback} from "react";
import {creatPubkeyWithSeed, Campaign_LAYOUT} from './utils'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
const programID = new PublicKey("8XsEwyf1VfrTi2fUcRoPaHhXs5W8Yznfha19vX961ZCx")

const CreateVoucher: FC = () => {
    const { connection } = useConnection()
    const {publicKey, sendTransaction} = useWallet();

    const onClick = useCallback(async () => {
        if(!publicKey){
            console.log("fail")
            return
        }
        let signature: TransactionSignature = ''
        try {
            const merchantPubkey = publicKey
            const voucherPubKey = (await creatPubkeyWithSeed(merchantPubkey,"hello world",programID))
            console.log("voucher public key: ", voucherPubKey.toString())
            const transaction = new Transaction();
            transaction.add(
                SystemProgram.createAccountWithSeed({
                fromPubkey: merchantPubkey,
                basePubkey: merchantPubkey,
                newAccountPubkey: voucherPubKey,
                lamports: await connection.getMinimumBalanceForRentExemption(
                    Campaign_LAYOUT.span
                ),
                seed: "hello world",
                space: Campaign_LAYOUT.span,
                programId: programID
            }));


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
            Create Voucher
            </Button>
        </div>
    )
}
export default CreateVoucher