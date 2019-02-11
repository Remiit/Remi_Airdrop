const web3 = require('../web3');
const Etx = require('ethereumjs-tx');

const RemiAirdrop = {
	constList:{
		contractAddress:'0x2f2CA545da3d537D76E477e597E7c4F9cde54f3d',
		abi:[ { "constant": false, "inputs": [ { "name": "_newToken", "type": "address" } ], "name": "setTokenAddress", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "_newSource", "type": "address" } ], "name": "setSourceAddress", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "DEFAULT_AMOUNT", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_newAmount", "type": "uint256" } ], "name": "setDefaultAmount", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "owner", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "REMI_INTERFACE", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_check", "type": "address" } ], "name": "_DESTROY_CONTRACT_", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "SOURCE_ADDRESS", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "newOwner", "type": "address" } ], "name": "transferOwnership", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "_recipientList", "type": "address[]" }, { "name": "_dropAmount", "type": "uint256" } ], "name": "airdropToken", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "name": "_tokenAddress", "type": "address" }, { "name": "_sourceAddress", "type": "address" }, { "name": "_defaultAmount", "type": "uint256" } ], "payable": false, "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [], "name": "contractDeployed", "type": "event" } ]
	},
	airdropToken:(keys, tx, args) => {
		const idx = tx[0];
		return new Promise((resolve, reject) => {
			let privateKey = keys[1].length > 64 ? keys[1].replace('0x', '') : keys[1];
			privateKey = Buffer.from(privateKey, 'hex');
			const contractAddr = RemiAirdrop.constList.contractAddress;
			const abi = RemiAirdrop.constList.abi;
			const contract = new web3.eth.Contract(abi, contractAddr);

			const obj = {
				nonce: 0,
				gasPrice: '0x'+Number(tx[1]).toString(16),
				gasLimit: '0x'+Number(tx[2]).toString(16),
				to: contractAddr,
				value: '0x0',
				data: contract.methods.airdropToken(...args).encodeABI(),
				chainId: 3
			};
			
			return web3.eth.getTransactionCount(keys[0]).then(nonce=>{
				obj.nonce = '0x'+Number(nonce).toString(16);

				const tx = new Etx(obj);
				tx.sign(privateKey);
				const stx = tx.serialize();
				
				return new Promise((rsol, rejec) => {
					web3.eth.sendSignedTransaction('0x'+stx.toString('hex'))
					.on('error', receipt=>{
						receipt = (JSON.parse(String(receipt).split('\n').slice(1).join('')));
						resolve({index:idx, nonce:Number(obj.nonce), receipt:receipt});
					})
					.then(receipt => {
						resolve({index:idx, nonce:Number(obj.nonce), receipt:receipt});
					});
				});
			});
		});
	}
}

module.exports = RemiAirdrop;