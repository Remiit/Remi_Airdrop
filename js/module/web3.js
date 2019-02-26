const Web3 = require('web3');
const { PROVIDER_ADDRESS } = require('./config');

const web3 = new Web3(Web3.givenProvider || PROVIDER_ADDRESS);

web3.transactionBlockTimeout = 5000;
web3.transactionPollingTimeout = 75000;

module.exports = web3;