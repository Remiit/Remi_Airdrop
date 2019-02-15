const dotenv = require('dotenv');

const result = dotenv.config();
if(result.error){throw result.error;}

const configEnv = {};
const list = ['COMMONENV', result.parsed.TARGET_SERVER];
for(let key in result.parsed) list.map(x => (key.indexOf(x) > -1) ? configEnv[key.replace(x + '_', '')] = result.parsed[key] : 0)

module.exports = configEnv;