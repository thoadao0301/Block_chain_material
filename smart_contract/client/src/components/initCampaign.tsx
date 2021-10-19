import {Button} from '@material-ui/core';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, TransactionSignature, PublicKey, SystemProgram, AccountMeta, TransactionInstruction } from '@solana/web3.js';
import {FC, useCallback} from "react";
import {creatPubkeyWithSeed, Campaign_LAYOUT} from './utils'
import { struct, u64, u8} from "@project-serum/borsh";
import BN from "bn.js";
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
            const merchantPubkey = publicKey
            const merchantCamPubKey = (await creatPubkeyWithSeed(merchantPubkey,"hello world",programID))
            console.log("merchant campaign public key: ", merchantCamPubKey.toString())
            const transaction = new Transaction();
            transaction.add(
                SystemProgram.createAccountWithSeed({
                fromPubkey: merchantPubkey,
                basePubkey: merchantPubkey,
                newAccountPubkey: merchantCamPubKey,
                lamports: await connection.getMinimumBalanceForRentExemption(
                    Campaign_LAYOUT.span
                ),
                seed: "hello world",
                space: Campaign_LAYOUT.span,
                programId: programID
            }));

            const keys: AccountMeta[] = [
                {pubkey: merchantCamPubKey, isSigner: false, isWritable: true},
                {pubkey: merchantPubkey, isSigner: true, isWritable: true}
            ];

            const dataLayout = struct([
                u8("instruction"),
                u64("price"),
                u64("total_amount"),
                u64("value"),
            ]);

            const data = Buffer.alloc(dataLayout.span);
            dataLayout.encode(
            {
                instruction: 0,
                price: new BN(99),
                total_amount: new BN(50),
                value: new BN(100)
            },
            data
            );

            transaction.add(
                new TransactionInstruction({
                    keys,
                    programId: programID,
                    data,
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
            Init Campaign
            </Button>
        </div>
    )
}
export default InitCampaign;