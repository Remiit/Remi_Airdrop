const http = require('http');
const fs = require('fs');
const url = require('url');
const mysql = require('mysql');

const configEnv = require('./config');

const RemiAirdrop = require('./api/RemiAirdrop');
const RemiToken = require('./api/RemiToken');

const dbConfig = {
	host     : configEnv['DATABASE_HOST'],
	user     : configEnv['DATABASE_USERNAME'],
	password : configEnv['DATABASE_PASSWORD'],
	database : configEnv['DATABASE_DATABASE']
 };

let server = http.createServer((req, res) => {
	let found = false;
	const parseUrl = url.parse(req.url, true);
	const uriList = parseUrl.pathname.split('/');
	if(req.method === 'GET'){
		if(req.url === '/'){
			return fs.readFile('./index.html', (err, data) => {
				if(err) throw err;
				res.end(data);
			});
        }else if(uriList[1] === 'getList'){
			found = true;
			const { index } = url.parse(req.url, true).query;
			const where = index=="FULL"?"1":("txIndex="+index);

			var connection = mysql.createConnection(dbConfig);
			connection.connect();
			connection.query('SELECT * FROM TEMPORAL_EVENTS where '+where, 
			(error, results, fields)=>{
				const data = {addrs:results.map(x => x.address), amt:results[0].amount};
				connection.end();
				res.end(JSON.stringify(data));
			});
		}else if(uriList[1] === 'getLog'){
			found = true;
			const { index } = url.parse(req.url, true).query;

			var connection = mysql.createConnection(dbConfig);
			connection.connect();
			connection.query('SELECT * FROM TEMPORAL_LOGS where txIndex='+index+' order by type asc',
			(error, results, fields) => {
				connection.end();
				res.end(JSON.stringify({state:results.length-1, logs:results}));
			});
		}else if(uriList[1] === 'getBalance'){
			found = true;
			const { addr } = url.parse(req.url, true).query;

			RemiToken.balanceOf([addr]).then(bal=>{
				res.end(JSON.stringify({bal:bal}));
			});
		}

		if(!found){
			return fs.readFile(`.${req.url}`, (err, data) => {
				if(err){
					res.writeHead(404, 'NOT FOUND');
					return res.end('NOT FOUND');
				}
				return res.end(data);
			});
		}
	}else if(req.method === 'POST'){
        let body = '';
		req.on('data', data => {
			body += data;
        });
		if(uriList[1] === 'sendTx'){
			const [publicKey, privateKey] = [configEnv['PUBLIC_KEY_1'], configEnv['PRIVATE_KEY_1']];
			return req.on('end', () => {
				const { tx, args } = JSON.parse(body);
				var connection = mysql.createConnection(dbConfig);
				connection.connect();
				connection.query('select * from TEMPORAL_LOGS where txIndex='+tx[0], (err,qResult) => {
					if(qResult.length>0){return res.end();}
					connection.query(`insert into TEMPORAL_LOGS values ("0",1,${tx[0]},0,"",0,"","","${tx[2]}","${tx[1]/1000000}",${Math.floor(Date.now()/1000)});`,function(){
						connection.end();
						RemiAirdrop.airdropToken([publicKey, privateKey],tx,args).then(data => {
							var connection = mysql.createConnection(dbConfig);
							connection.connect();
							connection.query(`insert into TEMPORAL_LOGS values ("",2,${data.index},${data.nonce},"${data.receipt.transactionHash}",${data.receipt.blockNumber},"${data.receipt.from}","${data.receipt.to}",${data.receipt.gasUsed},"${tx[1]/1000000}",${Math.floor(Date.now()/1000)});`, function(){
								connection.end();
								res.end(JSON.stringify({index:data.index, nonce:data.nonce, hash:data.receipt.transactionHash, gas:Number(data.receipt.gasUsed), state:Number(data.receipt.status)}));
							});
						});
					});
				})
			})
		}
		else if(uriList[1] === 'confirmTx'){
			return req.on('end', () => {
				const { txIndex } = JSON.parse(body);
				var connection = mysql.createConnection(dbConfig);
				connection.connect();
				connection.query('SELECT * FROM TEMPORAL_LOGS where txIndex='+index+' and type=2',
				(error, results, fields) => {
					connection.query('SELECT * FROM TEMPORAL_LOGS where txIndex='+index+' and type=2',
					(error, results, fields) => {
					});
				});
				connection.query(`insert into TEMPORAL_LOGS values ("0",1,${tx[0]},0,"",0,"","","${tx[2]}","${tx[1]/1000000}",${Math.floor(Date.now()/1000)});`,function(){
					connection.end();
					res.end(JSON.stringify({}));
				});
			})
		}
	}
}).listen(8081, () => {
	console.log('8081번 포트 실행');
})
server.timeout = 10 * 60 * 1000;