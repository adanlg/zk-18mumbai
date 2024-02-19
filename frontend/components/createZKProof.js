const { ethers } = require("ethers");
const $u = require('/home/adanlg2/zeroknowledge+18mumbai/frontend/utils/$u.js'); 
const wc = require("/home/adanlg2/zeroknowledge+18mumbai/circuit/withdraw_js/witness_calculator.js"); // Adjust the path if needed
const fs = require('fs').promises; 
const snarkjs = require("snarkjs");

//const tornadoJSON = require("../json/Tornado.json");
const tornadoABI = [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"root","type":"uint256"},{"indexed":false,"internalType":"uint256[10]","name":"hashPairings","type":"uint256[10]"},{"indexed":false,"internalType":"uint8[10]","name":"pairDirection","type":"uint8[10]"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"nullifierHash","type":"uint256"}],"name":"Withdrawal","type":"event"},{"inputs":[{"internalType":"uint256","name":"_commitment","type":"uint256"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_hasher","type":"address"},{"internalType":"address","name":"_verifier","type":"address"},{"internalType":"address","name":"_owner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"uint256[2]","name":"a","type":"uint256[2]"},{"internalType":"uint256[2][2]","name":"b","type":"uint256[2][2]"},{"internalType":"uint256[2]","name":"c","type":"uint256[2]"},{"internalType":"uint256[2]","name":"input","type":"uint256[2]"}],"name":"canWithdraw","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"commitments","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nextLeafIdx","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"nullifierHashes","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"roots","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"treeLevel","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"verifier","outputs":[{"internalType":"contract IVerifier","name":"","type":"address"}],"stateMutability":"view","type":"function"}]
;
const tornadoInterface = new ethers.utils.Interface(tornadoABI);

async function generateProofAndCallInputs(nullifierHash, secret, nullifier, commitment, txHash) {
    console.log("Starting proof generation and formatting call inputs");

    // nullifierHash = '13125408357818614416485832370279851114316633100976824177901908046640104411065';
    // secret = '85576571953208375473117892443112751812381983133816933235179941551738614002779';
    // nullifier = '107480320377630589624219244827751042336997689773529978597575376553434929092814';
    // commitment = '2714414015284128599254596977091222078214292335259277315379820054107442014975';
    // txHash = '0x8b1bba1a8a27a25e3a138722288af5ccac4880546eb918fe841e9ed690d3ba8e';

    try {
        const provider = new ethers.providers.JsonRpcProvider(process.env.API_KEY);


        const proofElements = {
            nullifierHash: `${nullifierHash}`,
            secret: secret,
            nullifier: nullifier,
            commitment: `${commitment}`,
            txHash: txHash
        };

        console.log(proofElements);

        const proofString = btoa(JSON.stringify(proofElements));
        console.log("Encoded proof string:", proofString);

        const decodedProofElements = JSON.parse(atob(proofString));
        console.log("Decoded proof elements:", decodedProofElements);

        console.log("Requesting transaction receipt for txHash:", decodedProofElements.txHash);
        const receipt = await provider.getTransactionReceipt(txHash);

        if (!receipt) {
            throw new Error("Empty receipt");
        }

        console.log("Receipt obtained:", receipt);
        const log = receipt.logs[0];
        console.log(log);
        const decodedData = tornadoInterface.decodeEventLog("Deposit", log.data, log.topics);
        console.log("Decoded log data:", decodedData);
        Aaddress = '0x416088778c5326F349F43aF56B80Aa2751bdD1FA';

        const proofInput = {
            "root": $u.BNToDecimal(decodedData.root),
            "nullifierHash": decodedProofElements.nullifierHash,
            "recipient": $u.BNToDecimal(Aaddress), 
            "secret": $u.BN256ToBin(decodedProofElements.secret).split(""),
            "nullifier": $u.BN256ToBin(decodedProofElements.nullifier).split(""),
            "hashPairings": decodedData.hashPairings.map((n) => ($u.BNToDecimal(n))),
            "hashDirections": decodedData.pairDirection
        };
        console.log("Proof input prepared:", proofInput);

        console.log("Generating zk-SNARK proof using groth16");
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(proofInput, "/home/adanlg2/zeroknowledge+18mumbai/circuit/withdraw_js/withdraw.wasm","/home/adanlg2/zeroknowledge+18mumbai/circuit/setup_final.zkey");
        console.log("Proof generated:", proof);

        const callInputs = [
            proof.pi_a.slice(0, 2).map($u.BN256ToHex),
            proof.pi_b.slice(0, 2).map((row) => ($u.reverseCoordinate(row.map($u.BN256ToHex)))),
            proof.pi_c.slice(0, 2).map($u.BN256ToHex),
            publicSignals.slice(0, 2).map($u.BN256ToHex)
        ];
        console.log("Formatted call inputs for smart contract:", callInputs);

        console.log("Copia y pega tu ZK Proof")
        function transformAndFormatArray(inputArray) {
            // Transform the array into a string and remove the first and last characters (which are [ and ])
            let result = JSON.stringify(inputArray).slice(1, -1);
        
            // Replace all instances of '],' with '],\n  ' for formatting (to add a new line and indentation after each array closing)
            result = result.replace(/\],/g, '],\n  ');
        
            return result;
        }

        const formattedOutput = transformAndFormatArray(callInputs);
        console.log(formattedOutput);
        return formattedOutput

    } catch (e) {
        console.error("An error occurred:", e);
    }
}


generateProofAndCallInputs('yourNullifierHashHere', 'yourSecretHere', 'yourNullifierHere', 'yourCommitmentHere', 'yourTxHashHere');

module.exports = { generateProofAndCallInputs };
