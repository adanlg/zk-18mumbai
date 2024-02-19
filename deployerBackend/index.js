const express = require('express');
const cors = require('cors');
const { ethers } = require("ethers");
require('dotenv').config();
const { generateProofAndCallInputs } = require('/home/adanlg2/zeroknowledge+18mumbai/frontend/components/createZKProof.js');
const wc = require("/home/adanlg2/zeroknowledge+18mumbai/circuit/withdraw_js/witness_calculator.js");


const fs = require('fs').promises;
const app = express();

console.log("Starting server...");

process.on('exit', (code) => {
    console.log(`Exiting with code: ${code}`);
});

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
    process.on(signal, () => {
        console.log(`Process received ${signal}`);
        process.exit();
    });
});
// Enable CORS for all requests
app.use(cors());
console.log("CORS enabled");

app.use(express.json());
console.log("JSON parsing enabled");

// Mumbai configurations
console.log("Configuring provider with API key:", process.env.API_KEY);
const provider = new ethers.providers.JsonRpcProvider(process.env.API_KEY);

// Contract details
console.log("Setting up contract details");
const contractAddress = "0x8099FAdB88D88edeC99bc60F721B6cf3f9e2760f";
// Assuming the ABI is correctly provided in the placeholder below
const contractABI = [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"root","type":"uint256"},{"indexed":false,"internalType":"uint256[10]","name":"hashPairings","type":"uint256[10]"},{"indexed":false,"internalType":"uint8[10]","name":"pairDirection","type":"uint8[10]"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"nullifierHash","type":"uint256"}],"name":"Withdrawal","type":"event"},{"inputs":[{"internalType":"uint256","name":"_commitment","type":"uint256"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_hasher","type":"address"},{"internalType":"address","name":"_verifier","type":"address"},{"internalType":"address","name":"_owner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"uint256[2]","name":"a","type":"uint256[2]"},{"internalType":"uint256[2][2]","name":"b","type":"uint256[2][2]"},{"internalType":"uint256[2]","name":"c","type":"uint256[2]"},{"internalType":"uint256[2]","name":"input","type":"uint256[2]"}],"name":"canWithdraw","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"commitments","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nextLeafIdx","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"nullifierHashes","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"roots","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"treeLevel","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"verifier","outputs":[{"internalType":"contract IVerifier","name":"","type":"address"}],"stateMutability":"view","type":"function"}];


async function checkNetworkConnection(provider) {
    try {
        console.log("Checking network connection...");
        const network = await provider.getNetwork();
        console.log("Connected to network:", network.name, network.chainId);
    } catch (error) {
        console.error("Network connection error:", error);
    }
}

// Call this function before operations requiring network access
checkNetworkConnection(provider);

console.log("Initializing contract");
const contract = new ethers.Contract(contractAddress, contractABI, provider);

// Using the private key from .env
console.log("Setting up wallet");
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);

console.log("Utility functions setup");
const utils = {
    moveDecimalLeft: (str, count) => {
        let start = str.length - count;
        let prePadding = "";

        while (start < 0) {
            prePadding += "0";
            start += 1;
        }

        str = prePadding + str;
        let result = str.slice(0, start) + "." + str.slice(start);
        if (result[0] == ".") {
            result = "0" + result;
        }

        return result;
    },
    BN256ToBin: (str) => {
        let r = BigInt(str).toString(2);
        let prePadding = "";
        let paddingAmount = 256 - r.length;
        for (var i = 0; i < paddingAmount; i++) {
            prePadding += "0";
        }
        return prePadding + r;
    },
    BN256ToHex: (n) => {
        let nstr = BigInt(n).toString(16);
        while (nstr.length < 64) { nstr = "0" + nstr; }
        nstr = `0x${nstr}`;
        return nstr;
    },
    BNToDecimal: (bn) => {
        return ethers.BigNumber.from(bn).toString();
    },
    reverseCoordinate: (p) => {
        let r = [0, 0];
        r[0] = p[1];
        r[1] = p[0];
        return r;
    }
};

app.post('/api/deposit', async (req, res) => {
    console.log("Received request for /api/deposit");
    try {
        const secret = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString();
        const nullifier = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString();
        console.log("Secret generated:", secret);
        console.log("Nullifier generated:", nullifier);

        const input = {
            secret: utils.BN256ToBin(secret).split(""),
            nullifier: utils.BN256ToBin(nullifier).split("")
        };

        console.log("Reading deposit wasm file...");
        var buffer = await fs.readFile("/home/adanlg2/zeroknowledge+18mumbai/circuit/deposit_js/deposit.wasm");
        console.log("Calculating witness...");
        var depositWC = await wc(buffer);
        
        const r = await depositWC.calculateWitness(input, 0);

        const commitmentStr = r[1].toString();
        const formatedCommitment = commitmentStr.endsWith('n') ? commitmentStr.slice(0, -1) : commitmentStr;
        console.log("Formatted Commitment:", formatedCommitment);

        const nullifierHashStr = r[2].toString();
        const formatedNullifierHash = nullifierHashStr.endsWith('n') ? nullifierHashStr.slice(0, -1) : nullifierHashStr;
        console.log("Formatted NullifierHash:", formatedNullifierHash);

        console.log("Sending deposit transaction...,");

        const transactionResponse = await contract.connect(wallet).deposit(formatedCommitment, { gasLimit: ethers.utils.hexlify(3000000) });
        await transactionResponse.wait();

        console.log('Transaction completed:', transactionResponse.hash);

        console.log("Generating zkProof...");
        const zkProof = await generateProofAndCallInputs(formatedNullifierHash, secret, nullifier, formatedCommitment, transactionResponse.hash);
        console.log("zkProof generated");

        res.json({ zkProof });
    } catch (error) {
        console.error('Error in /api/deposit:', error);
        res.status(500).send('Internal server error');
    }
});

app.post('/receive-data', async (req, res) => {
    console.log("Received request for /receive-data");
    try {
        const data = req.body;
        console.log('Data received:', data);

        console.log('Processing data:', data.param1);
        const transactionResponse = await contract.connect(wallet).deposit(data.param1, { gasLimit: ethers.utils.hexlify(3000000) });
        await transactionResponse.wait();
        
        console.log('Transaction completed:', transactionResponse.hash);

        res.status(200).json({txHash: transactionResponse.hash});
    } catch (error) {
        console.error('Error in /receive-data:', error);
        res.status(500).send('Server error');
    }
});

// Server Configuration
console.log("Configuring server...");
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

console.log("Setting keep-alive interval...");
setInterval(() => console.log("Keeping the app alive"), 1000 * 60 * 60); // Every hour

console.log("Setup complete. Server is running.");
