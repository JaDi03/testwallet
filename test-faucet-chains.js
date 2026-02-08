
// E2E Test for Faucet API with various chains
async function testFaucetChains() {
    console.log("Testing Faucet API for different chains...");
    const url = "http://localhost:3000/api/wallet";
    const userId = `test-chain-${Math.floor(Math.random() * 10000)}`;
    const address = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

    const chains = ['Sepolia', 'Base', 'Arc', 'eth', 'baseSepolia'];

    for (const chain of chains) {
        console.log(`\n--- Testing Chain: ${chain} ---`);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'faucet',
                    userId: `${userId}-${chain}`, // Pass the dynamic user ID
                    blockchain: chain,
                    address: address
                }),
            });

            const text = await response.text();
            console.log(`Status: ${response.status}`);
            console.log(`Body: ${text}`);

            if (response.ok) {
                console.log(`✅ ${chain}: Success`);
            } else {
                console.error(`❌ ${chain}: Failed`);
            }
        } catch (error) {
            console.error(`❌ ${chain}: Error ${error.message}`);
        }
    }
}

testFaucetChains();
