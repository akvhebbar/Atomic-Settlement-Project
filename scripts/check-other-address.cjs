const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
    const contractAddress = "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab";
    const abi = [
        "function owner() view returns (address)"
    ];
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    try {
        const owner = await contract.owner();
        console.log("Contract Owner of 0xe78A...:", owner);
    } catch (e) {
        console.log("Error getting owner of 0xe78A...:", e.message);
    }
}

main();
