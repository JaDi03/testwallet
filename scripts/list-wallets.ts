
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkWallets() {
    const apiKey = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

    if (!apiKey || !entitySecret) {
        console.error('Missing variables');
        return;
    }

    const client = initiateDeveloperControlledWalletsClient({
        apiKey,
        entitySecret,
    });

    try {
        const { data } = await client.listWallets({});
        console.log('--- WALLET LIST ---');
        data?.wallets?.forEach((w: any) => {
            console.log(`ID: ${w.id}`);
            console.log(`Address: ${w.address}`);
            console.log(`Blockchain: ${w.blockchain}`);
            console.log(`AccountType: ${w.accountType}`);
            console.log(`RefId: ${w.refId}`);
            console.log(`Name: ${w.name}`);
            console.log('-------------------');
        });
    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

checkWallets();
