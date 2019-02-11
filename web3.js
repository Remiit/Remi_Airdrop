const Web3 = require('web3');
const { ROPSTEN_ADDRESS } = require('./config');

const web3 = new Web3(Web3.givenProvider || ROPSTEN_ADDRESS);

module.exports = web3;