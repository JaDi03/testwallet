
import { createPublicClient, http, keccak256 } from 'viem';
import { arcTestnet } from '../src/lib/wallet-sdk';

const BURN_TX = "0x4ce5a38ce6aa631871f233ab0c64816b81a60ab6d576a595ed0c84827158b42e";

async function main() {
    const arcPublic = createPublicClient({
        chain: arcTestnet,
        transport: http("https://rpc.testnet.arc.network/")
    });

    try {
        const receipt = await arcPublic.getTransactionReceipt({ hash: BURN_TX as `0x${string}` });
        console.log(`\n📜 DUMPING ALL LOGS FOR TX: ${BURN_TX}`);
        console.log(`Total Logs: ${receipt.logs.length}`);

        for (const [i, log] of receipt.logs.entries()) {
            console.log(`\n[Log ${i}] ------------------`);
            console.log(`  Address: ${log.address}`);
            console.log(`  Topics:  ${log.topics.join(', ')}`);
            console.log(`  DataLen: ${log.data.length}`);
            console.log(`  Data:    ${log.data}`);
            if (log.data && log.data.length > 32) {
                console.log(`  MsgHash: ${keccak256(log.data)}`);
            }
        }
    } catch (e: any) {
        console.log(`⚠️ Error: ${e.message}`);
    }
}

main();
