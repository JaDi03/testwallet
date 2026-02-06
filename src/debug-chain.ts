
import { createPublicClient } from 'viem';
import { toModularTransport } from '@circle-fin/modular-wallets-core';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    const clientKey = process.env.NEXT_PUBLIC_CLIENT_KEY;
    const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL;

    if (!clientKey || !clientUrl) {
        console.error("Missing Env Vars");
        process.exit(1);
    }

    console.log("Testing with URL slug: /arcTestnet");

    // We don't define a chain strictly here, we let the transport tell us.
    // Or we use a dummy chain with ID 0 and see if it updates or throws

    const transport = toModularTransport(
        `${clientUrl}/arcTestnet`,
        clientKey
    );

    const client = createPublicClient({
        transport,
    });

    try {
        console.log("Fetching Chain ID...");
        const chainId = await client.getChainId();
        console.log("SUCCESS! Chain ID is:", chainId);
    } catch (error) {
        console.error("Failed to fetch Chain ID:", error);
    }
}

main();
