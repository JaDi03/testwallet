
import { createPublicClient, http, parseAbi } from 'viem';
import { arcTestnet } from '../src/lib/wallet-sdk';

const SOURCE_DOMAIN = 26; // Arc Testnet V2
const BURN_TX = "0xea3b790261a5db47eb0bea327a645c668aa5c92f3952b018a7a3ff71534e451d";

async function checkStatus() {
    console.log(`🔍 Checking CCTP V2 Status for Tx: ${BURN_TX}`);

    // Circle Iris V2 Endpoint
    const url = `https://iris-api-sandbox.circle.com/v2/messages/${SOURCE_DOMAIN}?transactionHash=${BURN_TX}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.log(`❌ API Error: ${response.status} ${response.statusText}`);
            return;
        }

        const data = await response.json();
        const message = data.messages?.[0];

        if (!message) {
            console.log("⏳ No message found yet in Circle Iris. (Indexing can take 15-20 min in Sandbox)");
            return;
        }

        console.log(`✅ Status: ${message.status}`);
        if (message.status === 'complete') {
            console.log("🎉 ATTENSTATION COMPLETED!");
            console.log(`Attestation: ${message.attestation}`);
            console.log(`Message: ${message.message}`);
        } else {
            console.log("⏳ Attestation still pending...");
        }
    } catch (e: any) {
        console.log(`❌ Fetch Error: ${e.message}`);
    }
}

checkStatus();
