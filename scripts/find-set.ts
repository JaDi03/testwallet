
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function findWalletSet() {
    const apiKey = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

    const client = initiateDeveloperControlledWalletsClient({
        apiKey,
        entitySecret,
    });

    try {
        const { data } = await client.listWalletSets({});
        console.log('Wallet Sets:', JSON.stringify(data, null, 2));
    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

findWalletSet();
