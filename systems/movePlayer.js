//ECSbus
var ECSbus 	 = require('../ECSbus');
let ecs 	 = ECSbus.ecs;
let entities = ECSbus.entities;

//broadcast
const broadcast = require('../broadcast.js');


//helper function
const getPlayerData = function(id)
{
	//more configuration other than just string overwrites should be done in their own system
	return {
		components: [
			"animation",
			"model",
			"health"
		],
		componentOverrides: {
			serverId: id,
			model: "player"
		}
	}
}


//listen for when new players are created
entities.emitter.on('clientCreate', entity =>
{
	let client = entities.getComponent(entity, 'client');

	//give players that just logged in data about the surrounding entities
	//tell the player where all of the models are

	client.once('loading', () =>
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
		entities.addComponent(entity, "model");
		let model = entities.getComponent(entity, "model");

		//tell everyone but the new player that a player joined.
		entities.find("client").forEach(player =>
        {
            if(player !== entity)
                entities.getComponent(player, "client").send('entitySpawn', 
                    getPlayerData(entity)
                );
        });

		//also listen for and apply their movement updates when they emit those.
		client.on('movementUpdate', data =>
		{
			//model orientation
			model.position    .fromArray(data.position);
            model.quaternion  .fromArray(data.quaternion);
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
	}
}