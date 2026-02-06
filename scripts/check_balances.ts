
import { createPublicClient, http, formatUnits, parseAbi } from "viem";
import { arcTestnet } from "./src/lib/wallet-sdk";

const USER_ADDRESS = "0x1a897228b62c5baa0d30031bb11e6e4e970caffb"; // Context address
const NATIVE_USDC = "0x3600000000000000000000000000000000000000";
const BRIDGED_USDC = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";

const ABI = parseAbi([
    "function balanceOf(address) view returns (uint256)"
]);

async function main() {
    const client = createPublicClient({
        chain: arcTestnet,
        transport: http("https://rpc.testnet.arc.network/")
    });

    console.log(`🔍 Checking Balances for ${USER_ADDRESS} on Arc Testnet...`);

    try {
        const nativeBalance = await client.readContract({
            address: NATIVE_USDC,
            abi: ABI,
            functionName: "balanceOf",
            args: [USER_ADDRESS]
        });
        console.log(`⛽ Native USDC (Gas): ${formatUnits(nativeBalance, 18)} USDC`);
    } catch (e) {
        console.log("❌ Error checking Native USDC:", e);
    }

    try {
        const bridgedBalance = await client.readContract({
            address: BRIDGED_USDC,
            abi: ABI,
            functionName: "balanceOf",
            args: [USER_ADDRESS]
        });
        console.log(`🌉 Bridged USDC (CCTP): ${formatUnits(bridgedBalance, 6)} USDC`); // Bridged usually 6 decimals? User said 0x89B5... need to verify decimals. usually standard USDC is 6.
    } catch (e) {
        console.log("❌ Error checking Bridged USDC:", e);
    }
}

main();
