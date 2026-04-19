const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
    const accounts = await provider.listAccounts();
    console.log("Ganache Accounts:");
    accounts.forEach((acc, i) => console.log(`${i}: ${acc.address}`));

    const contractAddress = "0x7D28F8dd50E15543232829eD24aEeD98D2834a67";
    const abi = [
        "function owner() view returns (address)"
    ];
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    try {
        const owner = await contract.owner();
        console.log("Contract Owner:", owner);
    } catch (e) {
        console.log("Error getting owner:", e.message);
    }
}

main();
