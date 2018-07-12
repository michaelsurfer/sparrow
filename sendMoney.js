const StellarSdk = require('stellar-sdk');
var rp = require('request-promise');
var express = require('express');
var app = express();
var cors = require('cors');

app.use(cors());

const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

StellarSdk.Network.useTestNetwork();

const senderSecret = 'SB6L5MOSGOLUBV5PWZ6MB5DTFI7UR6RR6EDVGA5ZMWW3PLM7MGSUFOIF';
const receiverPublicKey = 'GBNXVB6IYH665OTKTPK2BWXAY7OG4REDI63XSIFIIVPRBDRBCFEE23YQ';




async function deposit(senderSecret,amount){

var sourceKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
var sourcePublicKey = sourceKeypair.publicKey();
let newAccountPair = StellarSdk.Keypair.random();

server.loadAccount(sourcePublicKey)
	.then(function(account){
		var transaction = new StellarSdk.TransactionBuilder(account)
		.addOperation(StellarSdk.Operation.createAccount({
			destination:newAccountPair.publicKey(),
      		startingBalance: "25"  // in XLM
		}))
		.build();

	transaction.sign(sourceKeypair);
	console.log(transaction.toEnvelope().toXDR('base64'));

	});
 }




async function loadSkills(publicKey){

	var array={};

	server.transactions()
		.forAccount(publicKey)
		.call()
		.then(function(page){
			//console.log(page.records);
			var records=page.records;
			records.map((data,index)=>
							{
							var skill = data.memo;
							if(skill!=undefined){
								if (array[skill]){
									array[skill]++;
								}else{
									array[skill]=1;
								}
							}
							}
						);
			console.log(array);
		})

}

async function makeSendMoneyTx(senderSecret,receiverPublicKey,amount,skillset){

 //sender keypair

var sourceKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
var sourcePublicKey = sourceKeypair.publicKey();

server.loadAccount(sourcePublicKey)
	.then(function(account){
		var transaction = new StellarSdk.TransactionBuilder(account)
		.addOperation(StellarSdk.Operation.payment({
			destination:receiverPublicKey,
			asset:StellarSdk.Asset.native(),
			amount:amount,

		}))
		.addMemo(StellarSdk.Memo.text(skillset))
		.build();

		transaction.sign(sourceKeypair);
		console.log(transaction.toEnvelope().toXDR('base64'));
		console.log("submitting to Stellar network");

		server.submitTransaction (transaction)
			.then(function(transactionResult){
				console.log(JSON.stringify(transactionResult, null, 2));
        		console.log('\nSuccess! View the transaction at: ');
        		console.log(transactionResult._links.transaction.href);
        	}).catch(function (err){
        		console.log(err);
        	});


		});
};

loadSkills(receiverPublicKey);
//makeSendMoneyTx(senderSecret,receiverPublicKey,'100','java');
//deposit(senderSecret,100);


app.get('/loadSkills/:address',async function(req,res){

		var array={};
		var publicKey = req.params.address;
		server.transactions()
			.forAccount(publicKey)
			.call()
			.then(function(page){
				//console.log(page.records);
				var records=page.records;


				records.map((data,index)=>
								{
								//console.log(data.source_account);
								var skill = data.memo;

								if(skill!=undefined){
									if (array[skill]){
										array[skill]++;
									}else{
										array[skill]=1;
									}
								}
								}
							);

			res.send(array);
			})


});

app.get('/sendFund/:from-:to-:amount-:skill',async function(req,res){
	var json = req.params;
	var senderSecret = json.from;
	var receiverPublicKey = json.to;
	var amount = json.amount;
	var skillset = json.skill;



	var sourceKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
	var sourcePublicKey = sourceKeypair.publicKey();

	server.loadAccount(sourcePublicKey)
		.then(function(account){
			var transaction = new StellarSdk.TransactionBuilder(account)
			.addOperation(StellarSdk.Operation.payment({
				destination:receiverPublicKey,
				asset:StellarSdk.Asset.native(),
				amount:amount,

			}))
			.addMemo(StellarSdk.Memo.text(skillset))
			.build();

			transaction.sign(sourceKeypair);
			console.log(transaction.toEnvelope().toXDR('base64'));
			console.log("submitting to Stellar network");

			server.submitTransaction (transaction)
				.then(function(transactionResult){
					console.log(JSON.stringify(transactionResult, null, 2));
	        		console.log('\nSuccess! View the transaction at: ');
	        		console.log(transactionResult._links.transaction.href);
							res.send({
								data:transactionResult._links.transaction.href
							}
							);


	        	}).catch(function (err){
	        		console.log(err);
							res.send(err);

						});


			});


 });

app.listen(8001,function(){
	console.log('server running on 8001')
});
