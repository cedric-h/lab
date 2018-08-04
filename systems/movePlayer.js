//ECSbus
var ECSbus 	 = require('../ECSbus');
let ecs 	 = ECSbus.ecs;
let entities = ECSbus.entities;

//broadcast
const broadcast = require('../broadcast.js');


//variable declarations
var currentSpeeds = {};


//helper functions
const getPlayerData = function(entity)
{
	let weapon = entities.getComponent(entity, "weapon");

	return {
		components: [
			"animation",
			"modelName",
			"movement",
			"weapon",
			"health",
			"model"
		],
		componentOverrides: {
			serverId: entity,
			modelName: "player"
		},
		weaponName: weapon.name
	}
}


//listen for when new players are created
entities.emitter.on('clientCreate', entity =>
{
	let client = entities.getComponent(entity, 'client');

	//give players that just logged in data about the surrounding entities
	//tell the player where all of the models are

	client.once('loaded', () =>
	{
		let playersToInstantiate = [];

	    entities.find('client').forEach(otherEntity =>
	    {
	        if(entities.getComponent(otherEntity, "model") !== undefined && otherEntity !== entity)
	        	playersToInstantiate.push(getPlayerData(otherEntity));
	    });

	    client.send('playersToInstantiate', playersToInstantiate);
	});
	
	client.once('loaded', () =>
	{
		let model = entities.getComponent(entity, "model");

		//tell everyone but the new player that a player joined.
		entities.find("client").forEach(player =>
        {
            if(player !== entity)
                entities.getComponent(player, "client").send('entitySpawn', 
                    getPlayerData(entity)
                );
        });
	});
});


//ECS exports
module.exports = {
	load: new Promise((resolve, reject) =>
	{
		resolve();
	}),
	update: (entity, delta) =>
	{
		broadcast("currentSpeedsUpdate", currentSpeeds);
	}
}