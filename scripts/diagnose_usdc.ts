
import { createPublicClient, http, formatUnits, parseAbi } from "viem";
import { arcTestnet } from "../src/lib/wallet-sdk";

// User Smart Account Address (from logs)
const USER_ADDRESS = "0x1a897228b62c5baa0d30031bb11e6e4e970caffb";

// Contracts
const NATIVE_USDC = "0x3600000000000000000000000000000000000000";
const BRIDGED_USDC = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";

const ABI = parseAbi([
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
]);

async function main() {
    const client = createPublicClient({
        chain: arcTestnet,
        transport: http("https://rpc.testnet.arc.network/")
    });

    console.log(`\n🔍 DIAGNOSTIC: Checking USDC Balances & Decimals for ${USER_ADDRESS}\n`);

    // 1. Check Native USDC (Gas Token)
    try {
        const decimals = await client.readContract({ address: NATIVE_USDC, abi: ABI, functionName: "decimals" });
        const balance = await client.readContract({
            address: NATIVE_USDC,
            abi: ABI,
            functionName: "balanceOf",
            args: [USER_ADDRESS]
        });
        console.log(`⛽ Native USDC (0x3600...):`);
        console.log(`   Decimals: ${decimals}`);
        console.log(`   Balance:  ${formatUnits(balance, decimals)} USDC`);
        console.log(`   Raw:      ${balance}`);
    } catch (e) {
        console.log("❌ Error checking Native USDC:", e.message);
    }

    // 2. Check Bridged USDC (CCTP Token)
    try {
        const balance = await client.readContract({
            address: BRIDGED_USDC,
            abi: ABI,
            functionName: "balanceOf",
            args: [USER_ADDRESS]
        });
        console.log(`\n🌉 Bridged USDC (0x89B5...) [REQUIRED FOR BRIDGE]:`);
        console.log(`   Balance: ${formatUnits(balance, 6)} USDC`); // 6 decimals
        console.log(`   Raw:     ${balance}`);
    } catch (e) {
        console.log("❌ Error checking Bridged USDC:", e.message);
    }
    console.log("\n---------------------------------------------------");
}

main();
