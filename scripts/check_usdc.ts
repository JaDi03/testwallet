
import { createPublicClient, http, defineChain, parseAbi } from 'viem';

const arcTestnet = defineChain({
    id: 5042002,
    name: 'Arc Testnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.testnet.arc.network'] },
    },
});

const client = createPublicClient({
    chain: arcTestnet,
    transport: http(),
});

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

async function main() {
    console.log("Checking USDC at:", USDC_ADDRESS);

    try {
        const decimals = await client.readContract({
            address: USDC_ADDRESS,
            abi: parseAbi(["function decimals() view returns (uint8)"]),
            functionName: "decimals",
        });
        console.log("✅ Decimals:", decimals);
    } catch (e) {
        console.error("❌ Failed to read decimals:", e.message);
    }

    try {
        const symbol = await client.readContract({
            address: USDC_ADDRESS,
            abi: parseAbi(["function symbol() view returns (string)"]),
            functionName: "symbol",
        });
        console.log("✅ Symbol:", symbol);
    } catch (e) {
        console.error("❌ Failed to read symbol:", e.message);
    }
}

main();
