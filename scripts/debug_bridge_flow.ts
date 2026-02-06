
import { executeBatch } from '../src/lib/wallet-sdk';
import { CCTP_CONTRACTS, CCTP_DOMAINS, ERC20_ABI, TOKEN_MESSENGER_ABI } from '../src/agent/skills/cross-chain/config';
import { encodeFunctionData, parseUnits, parseAbi } from 'viem';

// Configuration
const CLIENT_URL = "https://modular-sdk.circle.com/v1/rpc/w3s/buidl";
const CLIENT_KEY = "TEST_CLIENT_KEY:97404013a113eccbbde441f7785d5d94:59ffa06b89e6c81db736bbf2d8f2942e";

// Arc Testnet Config
const MESSENGER_ADDRESS = CCTP_CONTRACTS[CCTP_DOMAINS.ARC_TESTNET].tokenMessenger;
const USDC_ADDRESS = CCTP_CONTRACTS[CCTP_DOMAINS.ARC_TESTNET].usdc;
const DEST_DOMAIN = 0; // ETH Sepolia
const AMOUNT = "1"; // 1 USDC (Small amount test)
const RECIPIENT = "0x29da6ce844f312020dbc65108285bdd89eea5ab6"; // User address (sending to self)

async function main() {
    console.log("🚀 Starting Debug Bridge Flow...");

    try {
        // Prepare Data
        const amountAtomic = parseUnits(AMOUNT, 6);
        const mintRecipientPadded = ("0x" + RECIPIENT.replace("0x", "").padStart(64, "0")) as `0x${string}`;

        console.log("1️⃣ Step 1: Approve TokenMessenger");
        const approveData = encodeFunctionData({
            abi: parseAbi(ERC20_ABI),
            functionName: "approve",
            args: [MESSENGER_ADDRESS, amountAtomic]
        });

        // 2. DepositForBurn
        console.log("2️⃣ Step 2: DepositForBurn");
        const burnData = encodeFunctionData({
            abi: parseAbi(TOKEN_MESSENGER_ABI),
            functionName: "depositForBurn",
            args: [amountAtomic, DEST_DOMAIN, mintRecipientPadded, USDC_ADDRESS]
        });

        console.log("📝 Sending Batch Transaction (Approve + Burn)...");
        const hash = await executeBatch(
            [
                { to: USDC_ADDRESS, value: "0", data: approveData },
                { to: MESSENGER_ADDRESS, value: "0", data: burnData }
            ],
            CLIENT_URL,
            CLIENT_KEY
        );

        console.log("✅ Success! Hash:", hash);
        console.log("Explorer: https://explorer-testnet.arc.circle.com/tx/" + hash);
    } catch (e: any) {
        console.error("❌ FAILED:", e);
        if (e.message) console.error("Message:", e.message);
        if (e.details) console.error("Details:", e.details);
    }
}

main();
