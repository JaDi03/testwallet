
import { createPublicClient, http, defineChain, parseAbi } from 'viem';
import { CCTP_CONTRACTS, CCTP_DOMAINS } from '../src/agent/skills/cross-chain/config';

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

const MESSENGER_ADDRESS = CCTP_CONTRACTS[CCTP_DOMAINS.ARC_TESTNET].tokenMessenger;

async function main() {
    console.log("🔍 Checking TokenMessenger at:", MESSENGER_ADDRESS);

    try {
        // Try to read 'localMessageTransmitter()' which is a standard getter on TokenMessenger
        const localTransmitter = await client.readContract({
            address: MESSENGER_ADDRESS as `0x${string}`,
            abi: parseAbi(["function localMessageTransmitter() view returns (address)"]),
            functionName: "localMessageTransmitter",
        });
        console.log("✅ TokenMessenger is VALID. LocalTransmitter:", localTransmitter);
    } catch (e) {
        console.error("❌ TokenMessenger verification FAILED:", e.message);

        // Try checking code existence
        const code = await client.getBytecode({ address: MESSENGER_ADDRESS as `0x${string}` });
        if (code) {
            console.log("⚠️ Contract exists (has bytecode) but call failed.");
        } else {
            console.log("💀 NO CONTRACT found at this address!");
        }
    }
}

main();
