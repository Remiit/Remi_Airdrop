const mysql = require('mysql');
const AirdropAPI = {
	promise:(func) => {
		return new Promise((resolve, reject) => {
			let rows = [];
			func.on('error', (err) => reject(err));
			func.on('result', (row) => rows.push(row));
			func.on('end', () => resolve(rows));
		});
	},
	tokenFormat : (dir,val) => {
		switch(dir){
			case 'StringToNumber':
				return BigInt(val.substr(0,val.length-18)) * BigInt(Math.pow(10,18)) + BigInt(val.substr(-18));
			case 'NumberToString':
				return String(val).substr(0,String(val).length-18)+'.'+String(val).substr(-18);
		}
	},
	chainError:(err) => {throw err;},
	sendTx:({dbConfig, tx, args, RemiAirdrop, RemiToken}) => {
		let connection = mysql.createConnection(dbConfig);
		connection.connect();
		let lastData, ownerBalance, txData = {};
		return new Promise((resolve, reject) => {
			AirdropAPI.promise(connection.query(`select * from TEMPORAL_LOGS where txIndex=${tx[0]}`))
			.then(result => {
				if(result.length>0){throw result.nonce;}
				return AirdropAPI.promise(connection.query(`insert into TEMPORAL_LOGS values ("0", 1, ${tx[0]}, 0, "", 0, "", "", "${tx[2]}", "${tx[1]/Math.pow(10,6)}", ${Math.floor(Date.now()/1000)});`));
			})
			.then(()=>{
				connection.end();
				return RemiAirdrop.airdropToken(tx,args)
			}, AirdropAPI.chainError)
			.then((data) => {
				connection = mysql.createConnection(dbConfig);
				connection.connect();
				txData = data;
				const insertQuery = connection.query(`insert into TEMPORAL_LOGS values ("",2,${txData.index},${txData.nonce},"${txData.receipt.transactionHash}",${txData.receipt.blockNumber},"${txData.receipt.from}","${txData.receipt.to}",${txData.receipt.gasUsed},"${tx[1]/1000000}",${Math.floor(Date.now()/1000)});`);
				return AirdropAPI.promise(insertQuery);
			}, AirdropAPI.chainError)
			.then(result => AirdropAPI.promise(connection.query(`SELECT * FROM TOKEN_MONITORING_DETAIL order by timestamp desc limit 0,1`)))
			.then(result => {
				lastData = result[0];
				return RemiToken.owner();
			}, AirdropAPI.chainError)
			.then(addr => RemiToken.balanceOf([addr]), AirdropAPI.chainError)
			.then((bal) => {ownerBalance = bal}, AirdropAPI.chainError)
			.then(result => {return RemiToken.totalSupply()}, AirdropAPI.chainError)
			.then(supply => {
				lastData['tokenOwn'] = lastData['tokenOwn'].substr(0,lastData['tokenOwn'].length-19)+''+lastData['tokenOwn'].substr(-18)

				_marketOwn = AirdropAPI.tokenFormat('StringToNumber',supply) - AirdropAPI.tokenFormat('StringToNumber',ownerBalance);
				_changeAmount = AirdropAPI.tokenFormat('StringToNumber',ownerBalance) - AirdropAPI.tokenFormat('StringToNumber',lastData['tokenOwn']);

				return connection.query(`insert into TOKEN_MONITORING_DETAIL values(
					0,
					${AirdropAPI.tokenFormat('NumberToString',supply)},
					${AirdropAPI.tokenFormat('NumberToString',ownerBalance)},
					${AirdropAPI.tokenFormat('NumberToString',_marketOwn)},
					"Airdrop",
					${AirdropAPI.tokenFormat('NumberToString',_changeAmount)},
					"${txData.receipt.transactionHash}",${txData.receipt.blockNumber},
					"${txData.receipt.from}","${txData.receipt.to}",
					"${txData.receipt.gasUsed * tx[1]/Math.pow(10,6)}",
					${Math.floor(Date.now()/1000)}
				);`, (error, qResult, fields) => {
					connection.end();
					resolve({index:txData.index, nonce:txData.nonce, hash:txData.receipt.transactionHash, gas:Number(txData.receipt.gasUsed), state:Number(txData.receipt.status)});
				});
			}, AirdropAPI.chainError)
			.then(null, (nonce) => {
				resolve({index:tx[0], nonce:nonce, hash:"ALREADY SENT TRANSACTION. CHECK DATABASE LOG", gas:0, state:0})
			})
		})
	},
	confirmTx:({connection, txIndex}) => {
		connection.connect();
		return new Promise((resolve, reject) => {
			let eventData, logData;
			AirdropAPI.promise(
				connection.query(`select * from TEMPORAL_EVENTS where txIndex=${txIndex} limit 0,1`)
			)
			.then((res) => {
				eventData = res[0];
				return AirdropAPI.promise(connection.query(`select * from TEMPORAL_LOGS where txIndex=${txIndex} and type=2`));
			})
			.then((res)=>{
				logData = res[0];
				const query = eventData.isExternal==1?`
					update BLUEPAN.TEMPORAL_EVENTS as TEMP
					LEFT JOIN BLUEPAN.BOUNTY_LIST as BOUN
					ON TEMP.motherSeq = BOUN.bountySeq
					set isSending = 1, txHash = "${logData.hash}", sendRemi = ${eventData.amount}	
					where TEMP.txIndex=${txIndex};
				`:`
					update BLUEPAN.TEMPORAL_EVENTS as TEMP
					INNER JOIN BLUEPAN.EVENT_MAPPING_LIST as MAPP
					ON TEMP.motherSeq = MAPP.Seq
					set isSending = 1, txHash = "${logData.hash}", sendRemi = ${eventData.amount}
					where TEMP.txIndex=${txIndex};
				`
				connection.query(query,(err, res) => {
					connection.end();
					resolve();
				})
			});
		});
	}
}

module.exports = AirdropAPI;