
// E2E Test for Faucet API
// Assumes Next.js is running on localhost:3000

async function testFaucetAPI() {
    console.log("Testing Faucet API via HTTP...");
    const url = "http://localhost:3000/api/wallet";

    // Use a random user ID to avoid rate limits during testing
    const userId = `test-user-${Math.floor(Math.random() * 10000)}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'faucet',
                userId: userId,
                blockchain: 'ARC-TESTNET',
                address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // Valid address
            }),
        });

        const text = await response.text();
        console.log(`Response Status: ${response.status}`);
        console.log(`Response Body: ${text}`);

        if (response.ok) {
            console.log("✅ API Test Passed!");
        } else {
            console.error("❌ API Test Failed!");
        }

    } catch (error) {
        console.error("❌ Connection failed. Is localhost:3000 running?", error.message);
    }
}

testFaucetAPI();
