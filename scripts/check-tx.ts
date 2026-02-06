
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function main() {
    const challengeId = process.argv[2] || "643896d2-7a40-5b92-9b88-8365fff7febd";

    const client = initiateDeveloperControlledWalletsClient({
        apiKey: process.env.CIRCLE_API_KEY!,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
    });

    try {
        console.log(`Checking transaction: ${challengeId}...`);
        const { data } = await client.getTransaction({ id: challengeId });
        console.log("Full JSON Response:");
        console.log(JSON.stringify(data, null, 2));
    } catch (err: any) {
        console.error("Error:", err.message);
    }
}

main();
