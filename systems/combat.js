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
		combat.target !== undefined 						   	&&
		entities.find('health').indexOf(combat.target) !== -1 	&&
		entities.getComponent(combat.target, "health").val > 0 	&&
		entities.find('model' ).indexOf(combat.target) !== -1
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

			broadcast('targetingUpdate', {
				attackerEntity: entity,
				targetEntity: 	combat.target
			});

			setTimeout(
				() =>
				{
					combat.readied  = true;
					combat.readying = false;
					combat.readiedPosition.copy(attackerModel.position);
					combat.readiedTime = Date.now();
				},
				preparationTimes['shoot'] * 1000
			)
		}
	});

	combat.emitter.on('toggleAttackOn', attackData =>
	{
		let weapon = entities.getComponent(entity, "weapon");
		let attack = weapon.attacks[attackData.attackIndex];

		if(weapon.type === "ranged" && !attack.active)
		{
			attack.active = true;
			combat.readying = true;
			combat.emitter.emit('newTarget', attackData.target);
			
			(function fireArrowIfShould()
			{
				if(
					entities.find('combat').indexOf(entity) === -1 ||
					!shouldFire(entity) 						   ||
					(!combat.readying && !combat.readied)
				)
				{
					if(attack.type === "toggle")
						attack.active = false;
				}

				else
				{
					//attacker components
					let combat 		  = entities.getComponent(entity, "combat");
					let attackerModel = entities.getComponent(entity, "model");

					let targetModel = entities.getComponent(combat.target, "model");
					let direction = Math.atan2(
						targetModel.position.y - attackerModel.position.y,
						targetModel.position.x - attackerModel.position.x
					);
					let attackerDirection = attackerModel.rotation.z;

					if(attackerDirection < direction + 0.09 && attackerDirection > direction - 0.09)
					{
						combat.emitter.emit('launchRangedAttack', attackData);
						//see attackRanged.js

						if(attack.type === "single")
							setTimeout(
								() => attack.active = false,
								attack.cooldown
							);

						if(client)
							client.send('attackBarUpdate', {
								slotIndex: attackData.attackIndex,
								ready: false,
								readyAgainAfter: attack.type === "single" ? attack.cooldown : 500
							});
					}

					//if the attack couldn't go through but the attack type was single,
					//try again in 100ms.
					else if(attack.type === "single")
						setTimeout(fireArrowIfShould, 100);

					//if the attack type is toggle, plot another attack soon regardless of
					//whether or not it hit.
					if(attack.type === "toggle")
						setTimeout(fireArrowIfShould, 500 + (Math.random()*32)*(Math.random()*32));
				}
			})();
		}

		else if(weapon.type === "melee")
		{
			combat.emitter.emit('newTarget', attackData.target);
			attack.active = true;
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
		'toggleAttackOn'
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
				model 										&&
				(
					model.position.x > lastPos.x + 4.2 ||
					model.position.x < lastPos.x - 4.2 ||
					model.position.y > lastPos.y + 4.2 ||
					model.position.y < lastPos.y - 4.2
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