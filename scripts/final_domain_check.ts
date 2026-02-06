
import { createPublicClient, http, keccak256 } from 'viem';
import { arcTestnet } from '../src/lib/wallet-sdk';

const BURN_TX_OLD = "0x5bcaf52fe19e8794b13351272fbb5de0ea6f270d102a5ccd29e547c6de55195a";
const BURN_TX_NEW = "0x4ce5a38ce6aa631871f233ab0c64816b81a60ab6d576a595ed0c84827158b42e";

async function queryIris(domain: number, tx: string) {
    const url = `https://iris-api-sandbox.circle.com/v1/messages/${domain}/${tx}`;
    try {
        const response = await fetch(url);
        if (response.ok) return await response.json();
    } catch (e) { }
    return null;
}

async function main() {
    console.log("🚀 Definitive Domain & Transaction Check");

    // Check Domain 7 (New Conf)
    console.log("\n--- DOMAIN 7 ---");
    console.log("Old Tx (0x5bca):", await queryIris(7, BURN_TX_OLD) ? "✅ FOUND" : "❌ Not Found");
    console.log("New Tx (0x4ce5):", await queryIris(7, BURN_TX_NEW) ? "✅ FOUND" : "❌ Not Found");

    // Check Domain 8 (Old Conf)
    console.log("\n--- DOMAIN 8 ---");
    console.log("Old Tx (0x5bca):", await queryIris(8, BURN_TX_OLD) ? "✅ FOUND" : "❌ Not Found");
    console.log("New Tx (0x4ce5):", await queryIris(8, BURN_TX_NEW) ? "✅ FOUND" : "❌ Not Found");

    // Check Domain 26 (Search result)
    console.log("\n--- DOMAIN 26 ---");
    console.log("Old Tx (0x5bca):", await queryIris(26, BURN_TX_OLD) ? "✅ FOUND" : "❌ Not Found");
    console.log("New Tx (0x4ce5):", await queryIris(26, BURN_TX_NEW) ? "✅ FOUND" : "❌ Not Found");
}

main();
