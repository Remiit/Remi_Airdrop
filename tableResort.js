const mysql = require('mysql');
const configEnv = require('./config');

const connection = mysql.createConnection({
	host     : configEnv['DATABASE_HOST'],
	user     : configEnv['DATABASE_USERNAME'],
	password : configEnv['DATABASE_PASSWORD'],
	database : configEnv['DATABASE_DATABASE']
 });

const TableResort = {
	getInternal: () => {
		return new Promise((res,rej)=>{
			connection.query(`
				SELECT 
					Mapping.seq as motherSeq, 
					Wallet.walletAddress as address, 
					Code.eventCoin * 2.5 as amount, 
					0 as isExternal
				FROM BLUEPAN.EVENT_CODE_LIST as Code
				LEFT JOIN BLUEPAN.EVENT_MAPPING_LIST as Mapping ON Code.eventSeq = Mapping.eventCodeSeq
				LEFT JOIN BLUEPAN.INTERNAL_EVENT_WALLET as Wallet ON Mapping.userSeq = Wallet.userSeq
				WHERE Wallet.walletAddress <> "" 
				ORDER BY amount ASC
			`,(error, qResult) => {res(qResult);})
		})
	},
	getExternal: (records) => {
		return new Promise((res,rej)=>{
			connection.query(`
				SELECT 
					bountySeq as motherSeq, 
					bountyWallet as address, 
					bountyCoin * 2.5 as amount, 
					1 as isExternal
				FROM BLUEPAN.BOUNTY_LIST 
				ORDER BY bountyCoin ASC
			`,(error, qResult) => {res([...records, ...qResult]);})
		})
	},
	sortRecord: (qResult) => {
		return new Promise((res,rej)=>{
			let output = [];
			qResult.map(record => {sum[record.address] = (sum[record.address]||0) + record.amount;});
			qResult.map(record => {
				if(record.amount != lastAmount){
					userIndex = txIndex*50;
					lastAmount = record.amount;
				}
				if(userIndex%50==0){txIndex++;}
	
				userIndex++;
				output.push(`(${userIndex},${txIndex},"${record.address}",${lastAmount},${sum[record.address]},${record.motherSeq},${record.isExternal})`);
			});
			res(output);
		});
	},
	insertRecord: (records) => {
		return new Promise ( (res, rej) => {
			if(records.length == 0){return res();}
			connection.query(`insert into TEMPORAL_EVENTS values ${records.slice(0,10000).join(',')}`,()=>{
				TableResort.insertRecord(records.slice(10000)).then(()=>{res()});
			});
		})
	}
}

let userIndex = 0, txIndex = 0, lastAmount = 0;
let sum = {};

connection.connect();
TableResort.getInternal()
.then((res)=>TableResort.getExternal(res))
.then((res)=>TableResort.sortRecord(res))
.then((res)=>TableResort.insertRecord(res))
.then(()=>{connection.end()})