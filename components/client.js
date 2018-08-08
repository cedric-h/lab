const EventEmitter = require('events');

class Client extends EventEmitter//analgous to "extends EventEmitter"
{
    constructor(entity, ws)
    {
        super();
    }

    initialize(ws)
    {
    	this.ws = ws;


        //error handling
        this.ws.on('error', error =>
        {
            console.log('ws Error!');
            console.log(error.code);
            console.log(error);
        });


    	//TODO: collapse this into one interval for all connections
    	//terminate the connection if they don't respond to a ping in 30 seconds
    	let isOpen = true;

    	this.ws.on('pong', () => isOpen = true);

    	let heartbeat = setInterval(() =>
    	{
    		if(ws.readyState === 3 || ws.readyState === 2)
    			clearInterval(heartbeat);

    		if(!isOpen)
    			this.ws.close(1000, 'ping timeout');

    		isOpen = false;

            if(this.ws.readyState === 1)
    		  this.ws.ping();

    		//if the ping above yields a pong, isOpen is set to true.
    		//if there's no pong before the next interval, then isOpen
    		//will still be false and the socket will thusly be closed.
    	}, 30*1000);


        //emit messages from the websocket after processing them.
        this.ws.on('message', (messageJSON) =>
        {
            let message = JSON.parse(messageJSON);
            this.emit(message.tag, message.data);
        });
    }

    send(tag, data)
    {
        if(this.ws.readyState === 1)
            this.ws.send(JSON.stringify({
                tag: tag,
                content: data
            }));
    }
}

module.exports = {
	load: new Promise((resolve, reject) =>
	{
		resolve();
	}),
	factory: () =>
	{
		return new Client();
	},
    reset: client =>
    {
        client.removeAllListeners();
    }
};