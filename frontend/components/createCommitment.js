const { ethers } = require("ethers");
const $u = require('../utils/$u.js'); 
const wc = require("/home/adanlg2/zeroknowledge+18mumbai/circuit/withdraw_js/witness_calculator.js"); 
const fs = require('fs').promises; 

async function main() {
    try {
        const secret = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString();
        const nullifier = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString();
        console.log("Secret generated:", secret.endsWith('n') ? secret.slice(0, -1) : secret);
        console.log("Nullifier generated:", nullifier.endsWith('n') ? nullifier.slice(0, -1) : nullifier);

        const input = {
            secret: $u.BN256ToBin(secret).split(""),
            nullifier: $u.BN256ToBin(nullifier).split("")
        };

        var buffer = await fs.readFile("/home/adanlg2/zero-knowledge/NFTA-Tornado-Resources/finale/circuit/deposit_js/deposit.wasm");
        var depositWC = await wc(buffer);

        const r = await depositWC.calculateWitness(input, 0);

        // Convert to string and then check for 'n'
        const commitmentStr = r[1].toString();
        console.log("Commitment:", commitmentStr.endsWith('n') ? commitmentStr.slice(0, -1) : commitmentStr);

        // Convert to string and then check for 'n'
        const nullifierHashStr = r[2].toString();
        console.log("NullifierHash:", nullifierHashStr.endsWith('n') ? nullifierHashStr.slice(0, -1) : nullifierHashStr);
        res.json({ commitment: commitmentStr, nullifierHash: nullifierHashStr });

    } catch (error) {
        console.error("Error:", error);
    }
}

// main().then(() => process.exit(0)).catch(error => {
//     console.error(error);
//     process.exit(1);
// });
