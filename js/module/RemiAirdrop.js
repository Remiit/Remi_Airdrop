const Etx = require('ethereumjs-tx');
const web3 = require('./web3');
const { CHAIN_ID, ADDRESS_AIRDROPCONTRACT, AIRDROPOWNER_PUBLICKEY, AIRDROPOWNER_PRIVATEKEY } = require('./config');

const RemiAirdrop = {
	constList:{
		contractAddress: ADDRESS_AIRDROPCONTRACT,
		abi:[ { "constant": false, "inputs": [ { "name": "_newToken", "type": "address" } ], "name": "setTokenAddress", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "_newSource", "type": "address" } ], "name": "setSourceAddress", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "DEFAULT_AMOUNT", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_newAmount", "type": "uint256" } ], "name": "setDefaultAmount", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "owner", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "REMI_INTERFACE", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_check", "type": "address" } ], "name": "_DESTROY_CONTRACT_", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "SOURCE_ADDRESS", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "newOwner", "type": "address" } ], "name": "transferOwnership", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "_recipientList", "type": "address[]" }, { "name": "_dropAmount", "type": "uint256" } ], "name": "airdropToken", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "name": "_tokenAddress", "type": "address" }, { "name": "_sourceAddress", "type": "address" }, { "name": "_defaultAmount", "type": "uint256" } ], "payable": false, "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [], "name": "contractDeployed", "type": "event" } ]
	},
	airdropToken:(tx, args) => {
		return new Promise((resolve, reject) => {
			const contractAddr = RemiAirdrop.constList.contractAddress;
			const contract = new web3.eth.Contract(RemiAirdrop.constList.abi, contractAddr);
			
			web3.eth.getTransactionCount(AIRDROPOWNER_PUBLICKEY).then(nonce=>{
				const obj = {
					nonce: '0x'+Number(nonce).toString(16),
					gasPrice: '0x'+Number(tx[1]).toString(16),
					gasLimit: '0x'+Number(tx[2]).toString(16),
					to: contractAddr,
					data: contract.methods.airdropToken(...args).encodeABI(),
					chainId: '0x'+CHAIN_ID.toString(16)
				};

				const txObj = new Etx(obj);
				txObj.sign(Buffer.from(AIRDROPOWNER_PRIVATEKEY.replace('0x', ''), 'hex'));
				
				web3.eth.sendSignedTransaction('0x'+txObj.serialize().toString('hex'))
				.on('error', receipt=>{
					receipt = (JSON.parse(String(receipt).split('\n').slice(1).join('')));
					resolve({index:tx[0], nonce:Number(obj.nonce), receipt:receipt});
				})
				.on('transactionHash', hash=>{console.log("Hash : ", hash)})
				.then(receipt => {
					resolve({index:tx[0], nonce:Number(obj.nonce), receipt:receipt});
				});
			});
		});
	}
}

module.exports = RemiAirdrop;