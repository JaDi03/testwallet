
import { createPublicClient, http, keccak256 } from 'viem';
import { arcTestnet } from '../src/lib/wallet-sdk';

const BURN_TX = "0x5bcaf52fe19e8794b13351272fbb5de0ea6f270d102a5ccd29e547c6de55195a";

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkStatus() {
    const arcPublic = createPublicClient({
        chain: arcTestnet,
        transport: http("https://rpc.testnet.arc.network/")
    });

    try {
        const receipt = await arcPublic.getTransactionReceipt({ hash: BURN_TX as `0x${string}` });

        console.log(`\n🔍 Scanning ${receipt.logs.length} logs...`);

        for (const log of receipt.logs) {
            if (!log.data || log.data === '0x') continue;

            const messageHash = keccak256(log.data);
            console.log(`  Log from ${log.address.slice(0, 12)}... | Len: ${log.data.length} | Hash: ${messageHash}`);

            try {
                const response = await fetch(`https://iris-api-sandbox.circle.com/attestations/${messageHash}`);
                const data = await response.json();

                if (data.status === "complete" || data.status === "pending" || data.status === "signing") {
                    console.log(`  🎯 MATCH FOUND! Status: ${data.status.toUpperCase()}`);
                    if (data.status === "complete") {
                        console.log(`\n✅ ATTESTATION READY!`);
                        console.log(`Attestation: ${data.attestation}\n`);
                        return true;
                    }
                }
            } catch (e) { }
        }

        console.log("⏳ Not ready yet.");
        return false;
    } catch (e) {
        console.log(`⚠️ Error: ${e.message}`);
        return false;
    }
}

async function main() {
    console.log(`Tx: ${BURN_TX}`);
    await checkStatus();
}

main();
