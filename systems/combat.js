//ECSbus
var ECSbus   = require('../ECSbus');
let ecs      = ECSbus.ecs;
let entities = ECSbus.entities;

//file system
const fs = require('fs-extra');

//broadcast
const broadcast = require('../broadcast.js');

//three.js
const THREE = require('three');


//variable declaration
var preparationTimes = {};


//helper functions
const shouldFire = entity =>
{	
	let combat = entities.getComponent(entity, "combat");
	let health = entities.getComponent(entity, "health");

	return (
		health.val > 0											&&
		combat.readied											&&
		combat.target !== undefined 						   	&&
		entities.find('health').indexOf(combat.target) !== -1 	&&
		entities.getComponent(combat.target, "health").val > 0 	&&
		entities.find('model' ).indexOf(combat.target) !== -1   &&
		combat.projectileCount < 8
	);
}


//remove targets if the target player died.
entities.emitter.on('modelRemove', removedEntity =>
{
    entities.find('combat').forEach(entity =>
    {
        let combat = entities.getComponent(entity, "combat");

        if(combat.target === removedEntity)
            combat.target = undefined;
    });
});


//client event listeners
entities.emitter.on('combatCreate', entity =>
{
	let client = entities.getComponent(entity, "client");
	let combat = entities.getComponent(entity, "combat");

	combat.emitter.on('newTarget', targetEntity =>
	{
		if(entities.find('model').indexOf(targetEntity) !== -1)
		{
			combat.target = targetEntity;

			//model grabbing
			let targetModel   = entities.getComponent(combat.target, "model");
			let attackerModel = entities.getComponent(entity,        "model");

			if(client)
				client.send(
					'faceTowards',
					new THREE.Quaternion().setFromEuler(
						new THREE.Euler(0, 0, Math.atan2(
								targetModel.position.y - attackerModel.position.y,
								targetModel.position.x - attackerModel.position.x
							)
						)
					).toArray()
				);

			broadcast('targetingUpdate', {
				attackerEntity: entity,
				targetEntity: 	combat.target
			});

			setTimeout(
				() =>
				{
					combat.readied = true;
					combat.readiedPosition.copy(attackerModel.position);
				},
				preparationTimes['shoot'] * 1000
			)
		}
	});

	combat.emitter.on('launchAttack', attackData =>
	{
		if(shouldFire(entity))
		{
			//attacker components
			let combat 		= entities.getComponent(entity, "combat");
			let attackerModel = entities.getComponent(entity, "model");

			//make sure the target hasn't already been killed
			let targetModel = entities.getComponent(combat.target, "model");
			let direction = Math.atan2(
				targetModel.position.y - attackerModel.position.y,
				targetModel.position.x - attackerModel.position.x
			);

			//check to see if they're in the right position until they are, then shoot.
			(function positionCheck()
			{
				//get new attackermodel, with updated position
				if(entity !== undefined && entities.find('model').indexOf(entity) !== -1)
				{
					let attackerModel = entities.getComponent(entity, "model");
					let attackerDirection = attackerModel.rotation.z;

					if(shouldFire(entity))
					{
						if(
							attackerDirection < direction + 0.09 &&
							attackerDirection > direction - 0.09
						)
							combat.emitter.emit('launchRangedAttack');//see rangedAttack.js

						else
							setTimeout(positionCheck, 100);
					}
				}
			})();
		}
	});
});


//handle client combat
entities.emitter.on('clientCreate', entity =>
{
	let client = entities.getComponent(entity, "client");
	entities.addComponent(entity, "combat");

	//when they join get them up to date.
	client.once('entitiesInstantiated', () =>
	{
		entities.find('combat').forEach(combatEntity =>
		{
			let combat = entities.getComponent(combatEntity, "combat");

			if(combat.target)
				client.send('targetingUpdate', {
					attackerEntity: combatEntity,
					targetEntity: 	combat.target
				});
		});
	});

	//transfer client events to combat.emitter
	[
		'launchAttack',
		'newTarget'
	].forEach(eventName =>
	{
		let transferEvent = data =>
			entities.getComponent(entity, "combat").emitter.emit(eventName, data);

		client.on(eventName, transferEvent);

		entities.emitter.on('clientRemove', function removeListeners(removedClientEntity)
		{
			if(removedClientEntity === entity)
			{
				client.removeListener(eventName, transferEvent);
				client.removeListener('clientRemove', removeListeners);
			}
		});
	});

	//unready if they move, so they can't shoot.
	let unreadyIfMoved = setInterval(
		() =>
		{
			let combat = entities.getComponent(entity, 'combat');
			let model  = entities.getComponent(entity, 'model');

			let lastPos = combat.readiedPosition;

			if(
				model &&
				(
					model.position.x > lastPos.x + 0.4 ||
					model.position.x < lastPos.x - 0.4 ||
					model.position.y > lastPos.y + 0.4 ||
					model.position.y < lastPos.y - 0.4
				)
			)
				combat.readied = false;
		},
		100
	);

	//unready if they stopped aiming on the clientside.
	const unreadyOnAimingStop = () =>
	{
		if(entities.find('combat').indexOf(entity) !== -1)
			entities.getComponent(entity, "combat").readied = false;
	}

	client.on('readiedNoLonger', unreadyOnAimingStop);

	//cleanup all of these listeners if the client leaves.
	entities.emitter.on('clientRemove', function removeListeners(removedClientEntity)
	{
		if(removedClientEntity === entity)
		{
			clearInterval(unreadyIfMoved);
			entities.emitter.removeListener('readiedNoLonger', unreadyOnAimingStop);
			entities.emitter.removeListener('clientRemove',    removeListeners);
		}
	});
});


//ECS exports
module.exports = {
    componentTypesAffected: [],
    load: new Promise((resolve, reject) =>
    {
    	fs.readFile('./public/assets/models/player.json').then(rawData =>
    	{
    		let data = JSON.parse(rawData);

    		data.animations.forEach(animation =>
    			preparationTimes[animation.name] = animation.length
    		);

    		resolve();
    	});
    }),
    update: (entity, delta) => 
    {
    }
};