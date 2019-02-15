const Web3 = require('web3');
const { PROVIDER_ADDRESS } = require('./config');

const web3 = new Web3(Web3.givenProvider || PROVIDER_ADDRESS);

module.exports = web3;