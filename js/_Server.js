const http = require('http');
const fs = require('fs');
const url = require('url');
const mysql = require('mysql');

const ENV = require('./module/config');

const RemiAirdrop = require('./module/RemiAirdrop');
const RemiToken = require('./module/RemiToken');
const AirdropAPI = require('./module/AirdropAPI');

const dbConfig = {
	host     : ENV['DATABASE_HOST'],
	user     : ENV['DATABASE_USERNAME'],
	password : ENV['DATABASE_PASSWORD'],
	database : ENV['DATABASE_DATABASE']
 };

let server = http.createServer((req, res) => {
	let found = false;
	const parseUrl = url.parse(req.url, true);
	const uriList = parseUrl.pathname.split('/');
	if(req.method === 'GET'){
		if(req.url === '/'){
			return fs.readFile(__dirname + '/../html/index.html', (err, data) => {
				if(err) throw err;
				res.end(data);
			});
		}else if(req.url === '/favicon.ico'){
			res.writeHead(204, 'NOT CONTENT');
			return res.end('NOT CONTENT');
        }else if(uriList[1] === 'getList'){
			found = true;
			const { index, from, to } = url.parse(req.url, true).query;

			const connection = mysql.createConnection(dbConfig);
			connection.connect();
			connection.query('SELECT * FROM TEMPORAL_EVENTS where '+(!index?`txIndex>=${from} and txIndex<=${to}`:`txIndex=${index}`), 
			(error, qResult)=>{
				connection.end();
				res.end(JSON.stringify(qResult));
			});
		}else if(uriList[1] === 'getLog'){
			found = true;
			const { index, from, to } = url.parse(req.url, true).query;

			const connection = mysql.createConnection(dbConfig);
			connection.connect();
			connection.query('SELECT * FROM TEMPORAL_LOGS where '+(!index?`txIndex>=${from} and txIndex<=${to}`:`txIndex=${index}`)+' and type=2 order by type asc',
				(error, qResult) => {
					connection.end();
					res.end(JSON.stringify(qResult));
				}
			);
		}else{
			return fs.readFile(__dirname + '/../html/' + uriList[1], (err, data) => {
				if(err) throw err;
				res.end(data);
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
		req.on('data', data => {body += data;});
		
		if(uriList[1] === 'sendTx'){
			return req.on('end', () => {
				const { tx, args } = JSON.parse(body);

				AirdropAPI.sendTx({dbConfig, tx, args, RemiAirdrop, RemiToken})
				.then((result) => {res.end(JSON.stringify(result));});
			})
		}else if(uriList[1] === 'getBalance'){
			return req.on('end', () => {
				const { addrs, validate } = JSON.parse(body);
				
				queue = addrs.map(addr => RemiToken.balanceOf([addr]));
				Promise.all(queue).then(result => {
					res.end(JSON.stringify(result.map(x => String(BigInt(x)/BigInt(Math.pow(10,18))))))
				});
			});
		}else if(uriList[1] === 'confirmTx'){
			return req.on('end', () => {
				const { txIndex } = JSON.parse(body);

				const connection = mysql.createConnection(dbConfig);
				AirdropAPI.confirmTx({connection, txIndex})
				.then((result) => {res.end(JSON.stringify(result));});
			})
		}
	}
}).listen(8081, () => {
	console.log('8081번 포트 실행');
})
server.timeout = 1000 * 60 * 1000;