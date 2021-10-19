import {publicKey, struct, u64, u8} from "@project-serum/borsh";
import {
    Connection,
    PublicKey,
    Keypair,
} from "@solana/web3.js";
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



export const Campaign_LAYOUT = struct([
    u8("account_type"),
    publicKey("merchant"),
    u64("total_amount"),
    u64("price"),
    u64("value"),
    u64("current_number")
]);

export const Voucher_LAYOUT = struct([
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
    merchantCamPubkey: PublicKey,
    connection: Connection,
){
    let campaignInfo = await connection.getAccountInfo(merchantCamPubkey,"confirmed")
    if (campaignInfo == null) throw new Error("Campaign not found");
    let camInfo = parseCampInfoData(campaignInfo.data)
    console.log("Camp Info: ", camInfo)
    return camInfo
}

export async function readInfoVoucher(
    voucherPubkey: PublicKey,
    connection: Connection,
){
    let voucherInfo = await connection.getAccountInfo(voucherPubkey,"confirmed")
    if (voucherInfo == null) throw new Error("Voucher not found");
    let vouInfo = parseVoucherInfoData(voucherInfo.data)
    console.log("Voucher Info: ", vouInfo)
    return vouInfo
}

