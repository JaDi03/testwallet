
import { getAddress } from "viem";

const addresses = {
    arcTestnet: {
        usdc: "0x3600000000000000000000000000000000000000",
        tokenMessenger: "0x8c9D55F8E537aD7Dd89F29D1d1338ac45B6B37C6",
        messageTransmitter: "0xE737e19EbF7F2558A4E4FfAE4764E8D2C27afF9F"
    },
    ethereumSepolia: {
        tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
        messageTransmitter: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
        usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
    }
};

console.log("--- Checksum Verification ---");

for (const importFn of ["arcTestnet", "ethereumSepolia"]) {
    console.log(`\nChecking ${importFn}...`);
    for (const [key, addr] of Object.entries(addresses[importFn as keyof typeof addresses])) {
        try {
            const checksummed = getAddress(addr);
            if (checksummed !== addr) {
                console.log(`❌ ${key} INVALID checksum.`);
                console.log(`   Current:  ${addr}`);
                console.log(`   Expected: ${checksummed}`);
            } else {
                console.log(`✅ ${key} OK`);
            }
        } catch (e) {
            console.log(`💥 ${key} ERROR: ${e.message}`);
        }
    }
}
