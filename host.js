module.exports = function(newClientHandler)
{
	//hosting da site
	const express = require('express');
	const app = express();

	//communicating to client
	const expressWs = require('express-ws')(app);


	//express setup

	//give them access to everything in /public
	app.use(express.static(__dirname + '/public')); 

	//send them the html file no matter where they go
	app.get('/', function(req, res, next)
	{
	    res.sendFile(__dirname + '/public/index.html');
	});

	//websockets! ;D
	app.ws('/', function clientConnected(ws, req)
	{
		newClientHandler(ws);
	});

	//express error handling
	app.use(function logErrors (err, req, res, next)
	{
		console.error(err.stack);
		next(err);
	});

	//server hosting.
	app.listen(80);
}