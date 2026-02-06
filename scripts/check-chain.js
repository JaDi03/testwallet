
const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
let clientUrl = '';

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/NEXT_PUBLIC_CLIENT_URL=(.*)/);
    if (match) {
        clientUrl = match[1].trim();
    }
}

if (!clientUrl) {
    console.error("Could not find NEXT_PUBLIC_CLIENT_URL");
    process.exit(1);
}

const bundlerUrl = `${clientUrl}/arcTestnet`;
console.log(`Querying Bundler: ${bundlerUrl}`);

const data = JSON.stringify({
    jsonrpc: "2.0",
    method: "eth_chainId",
    params: [],
    id: 1
});

const url = new URL(bundlerUrl);
const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        try {
            const json = JSON.parse(body);
            if (json.error) {
                console.error("RPC Error:", json.error);
            } else if (json.result) {
                const chainId = parseInt(json.result, 16);
                console.log(`SUCCESS! Chain ID is: ${chainId} (Hex: ${json.result})`);
            } else {
                console.log("Response:", body);
            }
        } catch (e) {
            console.error("Failed to parse JSON:", body);
        }
    });
});

req.on('error', error => {
    console.error("Request Error:", error);
});

req.write(data);
req.end();
