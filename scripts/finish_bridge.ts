
import { createPublicClient, http, createWalletClient, parseAbi, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const MESSAGE_TRANSMITTER_ADDR = '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD'; // Sepolia MessageTransmitter
const MESSAGE_BYTES = '0x000000010000001a0000000064cd136a0dfc77d5f4e78a02d5e4722cbc7896d56b7b074248c90b9fd4cbce380000000000000000000000008fe6b999dc680ccfdd5bf7eb0974218be2542daa0000000000000000000000008fe6b999dc680ccfdd5bf7eb0974218be2542daa00000000000000000000000000000000000000000000000000000000000000000000007d0000007d00000000100000000000000000000000036000000000000000000000000000000000000000000000000000000000000000f9f9cc8afeb56439b00b95c41ea28c0ec49d5d8700000000000000000000000000000000000000000000000000000000000186a00000000000000000000000001a897228b62c5baa0d30031bb11e6e4e970caffb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
const ATTESTATION_BYTES = '0xdd476901966a3380b59367d3e02028168233301a97825585f939e602e143163a7895f38446276c8c30a88fb24cf3cbbc36a1ca02763102b0c9537ae8e252e323c91c8746dffdabd57b326417c9baa42f31a05e117346cef42835d8ddf18d65270ed753f7cea426da038c4d10893b4b9bc09b8d19344719375c06ffe4d2d7e404f4121b'; // Complete hex from status check

const PK = process.env.VITE_PRIVATE_KEY as `0x${string}`;

async function main() {
    console.log("🚀 Executing Mint (receiveMessage) on Sepolia...");
    const account = privateKeyToAccount(PK);
    const walletClient = createWalletClient({
        account,
        chain: sepolia,
        transport: http('https://sepolia.drpc.org')
    });

    const publicClient = createPublicClient({
        chain: sepolia,
        transport: http('https://sepolia.drpc.org')
    });

    try {
        const hash = await walletClient.writeContract({
            address: MESSAGE_TRANSMITTER_ADDR,
            abi: parseAbi(['function receiveMessage(bytes message, bytes attestation) returns (bool)']),
            functionName: 'receiveMessage',
            args: [MESSAGE_BYTES as `0x${string}`, ATTESTATION_BYTES as `0x${string}`]
        });

        console.log(`✅ Mint Transaction Sent: ${hash}`);
        console.log("Waiting for confirmation...");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log("🎊 BRIDGE COMPLETED SUCCESSFULLY!");
        console.log(`Sepolia Tx: https://sepolia.etherscan.io/tx/${receipt.transactionHash}`);
    } catch (e: any) {
        console.log(`❌ Mint Failed: ${e.message}`);
    }
}

main();
