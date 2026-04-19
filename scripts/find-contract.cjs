const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
    const accounts = await provider.listAccounts();
    const deployer = accounts[0].address;
    console.log("Deployer:", deployer);

    // Check first 10 addresses for contract code
    for (let i = 0; i < 20; i++) {
        // Derive address from deployer and nonce
        const futureAddress = ethers.getCreateAddress({
            from: deployer,
            nonce: i
        });
        const code = await provider.getCode(futureAddress);
        if (code !== "0x") {
            console.log(`Found contract at nonce ${i}: ${futureAddress}`);
        }
    }
    
    // Also check the ones I already have
    const knowns = ["0x7D28F8dd50E15543232829eD24aEeD98D2834a67", "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab"];
    for (const addr of knowns) {
        const code = await provider.getCode(addr);
        console.log(`Code at ${addr}: ${code === "0x" ? "None" : "Exists (" + code.length + " bytes)"}`);
    }
}

main();
