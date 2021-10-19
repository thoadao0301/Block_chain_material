import {publicKey, struct, u64, u8} from "@project-serum/borsh";
import {
    Connection,
    PublicKey,
    Keypair,
    sendAndConfirmTransaction,
    Transaction,
    TransactionInstruction,
    SystemProgram,
    AccountMeta,
    AccountInfo,
} from "@solana/web3.js";
import BN from "bn.js";
import { readFileSync } from "fs";
import {ASSOCIATED_TOKEN_PROGRAM_ID,
    Token,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
  
export async function createAssociatedTokenAccount(
    connection: Connection,
    mint: PublicKey,
    wallet: Keypair,
): Promise<PublicKey> {
    const associatedTokenAddres = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        wallet.publicKey
    )
    if (await connection.getAccountInfo(associatedTokenAddres)){
        return associatedTokenAddres
    }
    const tokenClient = new Token(connection, mint, TOKEN_PROGRAM_ID, wallet)
    console.log("create associated token account for: ", wallet.publicKey.toBase58())
    return await tokenClient.createAssociatedTokenAccount(wallet.publicKey)
}

function readKeypairFromPath(path: string): Keypair {
    const data = JSON.parse(readFileSync(path, "utf-8"))
    return Keypair.fromSecretKey(Buffer.from(data))
}


const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
    )
const programKeypair = readKeypairFromPath(__dirname + "/../localnet/program-keypair.json")
const PhucLongKeypair = readKeypairFromPath(__dirname + "/../localnet/PhucLong.json")
const TCHKeypair = readKeypairFromPath(__dirname + "/../localnet/TCHouse.json")
const userKeypair = readKeypairFromPath(__dirname + "/../localnet/user.json")
const mint = new PublicKey("7VXbqsxnd9h2dYbFL1Xxt6KV69bnY6vabSmXvTyD9VXb")
const programID = new PublicKey("8XsEwyf1VfrTi2fUcRoPaHhXs5W8Yznfha19vX961ZCx")

const Campaign_LAYOUT = struct([
    u8("account_type"),
    publicKey("merchant"),
    u64("total_amount"),
    u64("price"),
    u64("value"),
    u64("current_number")
]);

const Voucher_LAYOUT = struct([
    u8("account_type"),
    publicKey("campaign_id"),
    u64("voucher_number"),
    publicKey("voucher_buyer"), 
    publicKey("voucher_user")
])
export async function creatPubkeyWithSeed(
    fromPubkey: PublicKey,
    seed: string,
    programId: PublicKey
) {
    let newPubkey = new PublicKey(0)
    newPubkey =  await PublicKey.createWithSeed(
        fromPubkey,
        seed,
        programId,
    )
    return newPubkey
}
export async function initCampaign(
    merchantKeypair: Keypair,
    price: number,
    total_amount: number,
    value: number,
) {
    const programPubkey = programKeypair.publicKey
    const merchantPubkey = merchantKeypair.publicKey
    const merchantCamPubKey = (await creatPubkeyWithSeed(merchantPubkey,"hello world",programPubkey))
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
        })
    );

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
            price: new BN(price),
            total_amount: new BN(total_amount),
            value: new BN(value)
        },
        data
    );

    transaction.add(
        new TransactionInstruction({
            keys,
            programId: programID,
            data,
        })
    );
    const initRes = await sendAndConfirmTransaction(
        connection,
        transaction,
        [merchantKeypair]
    )

    console.log("Init campaign: ", initRes)
}




class CampaignInfo {
    account_type: number;
    merchant: String;
    price: number;
    total_amount: number;
    value: number;
    current_number: number;

    constructor(
        account_type: number,
        merchant: String,
        price: number,
        total_amount: number,
        value: number,
        current_number: number,
    ) {
        this.account_type = account_type;
        this.merchant = merchant;
        this.price = price;
        this.total_amount = total_amount;
        this.value = value;
        this.current_number = current_number;
    }
}


function parseCampInfoData(data: any){
    let {
        account_type,
        merchant,
        price,
        total_amount,
        value,
        current_number,
    } = Campaign_LAYOUT.decode(data);
    return new CampaignInfo(
        account_type,
        (new PublicKey(merchant)).toString(),
        price.toNumber(),
        total_amount.toNumber(),
        value.toNumber(),
        current_number.toNumber()
    );
}


class VoucherInfo {
    account_type: number;
    campaign_id: String;
    voucher_number: number;
    voucher_buyer: String;
    voucher_user: null | String;

    constructor(
        account_type: number,
        campaign_id: String,
        voucher_number: number,
        voucher_buyer: String,
        voucher_user: null | String,
    ) {
        this.account_type = account_type;
        this.campaign_id = campaign_id;
        this.voucher_number = voucher_number;
        this.voucher_buyer = voucher_buyer;
        this.voucher_user = voucher_user
    }
}

function parseVoucherInfoData(data: any){
    let {
        account_type,
        campaign_id,
        voucher_number,
        voucher_buyer,
        voucher_user,
    } = Voucher_LAYOUT.decode(data);
    return new VoucherInfo(
        account_type,
        (new PublicKey(campaign_id)).toString(),
        voucher_number.toNumber(),
        (new PublicKey(voucher_buyer)).toString(),
        (new PublicKey(voucher_user)).toString(),
    );
}

export async function readInfo(
    merchantCamPubkey: PublicKey
){
    let campaignInfo = await connection.getAccountInfo(merchantCamPubkey,"confirmed")
    if (campaignInfo == null) throw new Error("Campaign not found");
    console.log(campaignInfo)
    //const data = Buffer.from(campaignInfo.data)
    let camInfo = parseCampInfoData(campaignInfo.data)
    console.log("Camp Info: ", camInfo)
    return camInfo
}

export async function readInfoVoucher(
    voucherPubkey: PublicKey
){
    let voucherInfo = await connection.getAccountInfo(voucherPubkey,"confirmed")
    if (voucherInfo == null) throw new Error("Voucher not found");
    console.log(voucherInfo)
    //const data = Buffer.from(campaignInfo.data)
    let vouInfo = parseVoucherInfoData(voucherInfo.data)
    console.log("Voucher Info: ", vouInfo)
    return vouInfo
}

export async function buy(
    campaignPubkey: PublicKey,
    merchantKeypair: Keypair,
    buyer: Keypair
) {
    const programId = programKeypair.publicKey
    let voucherPubkey = (await creatPubkeyWithSeed(merchantKeypair.publicKey,"helloworld",programID))
    console.log(voucherPubkey.toString())

    const transaction = new Transaction()
    transaction.add(
        SystemProgram.createAccountWithSeed({
            fromPubkey: merchantKeypair.publicKey,
            basePubkey: merchantKeypair.publicKey,
            newAccountPubkey: voucherPubkey,
            lamports: await connection.getMinimumBalanceForRentExemption(
                Voucher_LAYOUT.span
            ),
            seed: "helloworld",
            space: Voucher_LAYOUT.span,
            programId: programID
        })
    );

    let merchantTokenPubkey = await createAssociatedTokenAccount(connection,mint,merchantKeypair)
    let buyerTokenPubkey = await createAssociatedTokenAccount(connection,mint,buyer)
    
    //let camInfo = readInfo(campaignKeyPair)
    const keys: AccountMeta[] = [
        {pubkey: campaignPubkey, isSigner: false, isWritable: true},
        {pubkey: merchantKeypair.publicKey, isSigner: true, isWritable: false},
        {pubkey: voucherPubkey, isSigner: false, isWritable: true},
        {pubkey: buyer.publicKey, isSigner: true, isWritable: true},
        {pubkey: buyerTokenPubkey, isSigner: false, isWritable: true},
        {pubkey: merchantTokenPubkey, isSigner: false, isWritable: true},
        {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false}
    ]

    const dataLayout = struct([u8("instruction")])
    const data = Buffer.alloc(dataLayout.span)
    dataLayout.encode(
        {
            instruction: 1
        },
        data
    )
    transaction.add(
        new TransactionInstruction({
            keys,
            programId: programID,
            data,
        })
    )

    const buySlot = await sendAndConfirmTransaction(
        connection,
        transaction,
        [merchantKeypair,buyer]
    )
    console.log("transaction ix: ", buySlot)
}

export async function InitVoucher2User(
    voucherPubkey: PublicKey,
    voucher_buyer: Keypair,
    userPubkey: PublicKey,  
) {
    const programId = programKeypair.publicKey
    const voucherBuyerPubkey = voucher_buyer.publicKey

    const transaction = new Transaction();

    const keys: AccountMeta[] = [
        {pubkey: voucherPubkey, isSigner: false, isWritable: true},
        {pubkey: voucherBuyerPubkey, isSigner: true, isWritable: true},
        {pubkey: userPubkey, isSigner:false, isWritable: true}
    ]

    const dataLayout = struct([u8("instruction")])
    const data = Buffer.alloc(dataLayout.span)
    dataLayout.encode(
        {
            instruction: 2,
        },
        data
    )
    transaction.add(
        new TransactionInstruction({
            keys,
            programId: programID,
            data
        })
    )
    const InitUserix = await sendAndConfirmTransaction(
        connection,
        transaction,
        [voucher_buyer]
    )
    console.log("Init User 2 voucher: ", InitUserix)
}

export async function closeVoucher(
    voucherPubkey: PublicKey,
    campaignPubkey: PublicKey,
    merchantKeypair: Keypair,
    userPubkey: PublicKey
) {
    const programId = programKeypair.publicKey
    const merchantPubkey = merchantKeypair.publicKey

    const transaction = new Transaction()

    const keys: AccountMeta[] = [
        {pubkey: voucherPubkey, isSigner: false, isWritable: true},
        {pubkey: campaignPubkey, isSigner: false, isWritable: true},
        {pubkey: merchantPubkey, isSigner: true, isWritable: false},
        {pubkey: userPubkey, isSigner: false, isWritable: false}
    ]

    const dataLayout = struct([u8("instruction")])
    const data = Buffer.alloc(dataLayout.span)
    dataLayout.encode(
        {
            instruction: 3,
        },
        data
    )
    transaction.add(
        new TransactionInstruction({
            keys,
            programId: programId,
            data
        })
    )
    const CloseVoucherix = await sendAndConfirmTransaction(
        connection,
        transaction,
        [merchantKeypair]
    )
    console.log("Close voucher: ", CloseVoucherix)
}


// Test instruction

let price = 99 //lamport
let total_amount = 50
let value = 100 
//initCampaign(TCHKeypair,price,total_amount,value)
let TCHCampubkey = new PublicKey("6xzSzomAQmJ22WHbWhZaq5NFvwwRWEqYYVtks63Jr6iu")
readInfo(TCHCampubkey)
//buy(TCHCampubkey,TCHKeypair,PhucLongKeypair)
let voucherkey = new PublicKey("3dqF4NU9NdWzHjFgvchxppbUpQLJibvzWmJwTKmQgrFa")
//readInfoVoucher(voucherkey)
//InitVoucher2User(voucherkey,PhucLongKeypair, userKeypair.publicKey)
//readInfoVoucher(voucherkey)
//closeVoucher(voucherkey,TCHCampubkey,TCHKeypair,userKeypair.publicKey)
//readInfoVoucher(voucherkey)
