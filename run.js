
var express = require('express');
var app = express();
var cors = require('cors');
const path = require('path');

app.use(cors());
app.use( express.static( `build` ) );


app.get('/',function(req,res){
	res.sendFile(path.join(__dirname, '/build/index.html'));
});

app.get('*',function(req,res){
	res.sendFile(path.join(__dirname, '/build/index.html'));
});


app.listen(8000,function(){
	console.log('server running on 8000')
});
