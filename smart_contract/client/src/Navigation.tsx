import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import React, {FC} from "react";

const Navigation: FC = () => {
    const {wallet} = useWallet();
    console.log(wallet)
    return (
        <nav>
            <h1>Solana App</h1>
            <div>
                <WalletMultiButton />
            </div>
        </nav>
    )
}

export default Navigation;