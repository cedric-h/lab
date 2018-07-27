//ECSbus
var ECSbus 	 = require('../ECSbus');
let ecs 	 = ECSbus.ecs;
let entities = ECSbus.entities;

//file system
const fs = require('fs-extra');


//get the things they'll later load
var ecsDirectories;
var meshDirectory = [];


//listening for a new player to join so you can give them stuff to load
entities.emitter.on('clientCreate', clientEntity =>
{
	let client = entities.getComponent(clientEntity, 'client');

	//helpful logging
    console.log('client connected');

    //then just tell the client where stuff is so that they can load it.
    client.on('loadingECS', () =>
    {
        client.send('ecsDirectories', ecsDirectories);
    });

    client.on('loading', () =>
    {
        //tell the player where the models they need to load are
        client.send('meshLocations', meshDirectory);
    });
})


//ECS exports
module.exports = {
	componentTypesAffected: ["client"],
	load: new Promise((resolve, reject) =>
	{
        //get the names of the files that the clients will need to load.
        ecsDirectories = {
            'components':   fs.readdirSync('./public/js/components').map(x => './js/components/' + x),
            'systems':      fs.readdirSync('./public/js/systems').map(x => './js/systems/' + x)
        };

        //load the meshDirectories
        [].concat(
            fs.readdirSync('./public/assets/models/').map(x => './assets/models/' + x),
            fs.readdirSync('./public/assets/scenes/').map(x => './assets/scenes/' + x),
            fs.readdirSync('./public/assets/collisionMaps/').map(x => './assets/collisionMaps/' + x)
        ).forEach(fileName => 
        {
            let splitName = fileName.split('.');

            //if the file extension is .json, it needs to be loaded.
            //the names of the external files the models use are included in those jsons,
            //so no need to worry about those.
            if(splitName[splitName.length - 1] === "json")
                meshDirectory.push(splitName.splice(0, splitName.length - 1).join('.'))
        });

        //return
		resolve();
	}),
	update: (entity, delta) =>
	{
	}
}