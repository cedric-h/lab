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
const shouldFire = combat =>
	entities.getComponent(combat.target, "health").val > 0 &&
	entities.find('model').indexOf(combat.target) !== -1   &&
	combat.projectileCount < 8;


function attack(attackerEntity)
{
	//attacker components
	let combat 		= entities.getComponent(attackerEntity, "combat");
	let playerModel = entities.getComponent(attackerEntity, "model");
	let client 		= entities.getComponent(attackerEntity, "client");
	//target components
	let targetModel = entities.getComponent(combat.target, "model");

	//record the firing of this new projectile     
	combat.projectileCount++;

	//modify where the arrow will go with some juicy randomness
	let targetPosition = targetModel.position.clone();
	let size 	       = new THREE.Vector3();
	let targetBox      = new THREE.Box3();
    targetBox.setFromArray(targetModel.geometry.vertices);
    targetBox.getSize(size);
    //apply randomness based on the dimensions of the target model
    targetPosition.x += (size.x * targetModel.scale.x) * (0.4 - Math.random()*0.8);
    targetPosition.y += (size.y * targetModel.scale.y) * (0.4 - Math.random()*0.8);
    targetPosition.z += (size.z * targetModel.scale.z) * (0.2 + Math.random()*0.6);

    //have the player shift their gun to point at the targetPosition instead of the model's origin
    broadcast('aimWeaponAt', {
		attackerEntity: attackerEntity,
		targetPosition: targetPosition.toArray()
	});

    //wait a bit, then fire the arrow
    setTimeout(
    	() =>
    	{
    		//get the arrow set up
			let arrowEntity = entities.create();
			//add components
			entities.addComponent(arrowEntity, "model");
			entities.addComponent(arrowEntity, "flightpath");
			//grab components
			let arrowModel = entities.getComponent(arrowEntity, "model");
			let flightpath = entities.getComponent(arrowEntity, "flightpath");
			
			//stick the arrow in their gun
			arrowModel.position.set(0.7, 0, 1.17);//hardcoding this is bad
			//these next commands spin the arrow position if the player is rotated
			playerModel.updateMatrixWorld();
			arrowModel.position.copy(playerModel.localToWorld(arrowModel.position));

			//configure the flightpath
			flightpath.start.copy(arrowModel.position);
			flightpath.end  .copy(targetPosition);
			flightpath.speed = 20;

			//make sure the arrow points in the right direction
			arrowModel.lookAt(flightpath.end);

			//let the player know about the new arrow
			broadcast('entitySpawn', {
				components: [
					"modelName"
				],
				componentOverrides: {
					serverId: arrowEntity,
					modelName: "arrow"
				},
				position: 	 arrowModel.position  .toArray(),
				quaternion:  arrowModel.quaternion.toArray()
			});

			//do damage once the arrow is removed.
		    entities.emitter.on('flightpathRemove', function dealDamage(thisArrowEntity)
			{
				if(thisArrowEntity === arrowEntity)
				{
					//in case the target died while the arrow was flying.
					if(entities.find('health').indexOf(combat.target) !== -1)
					{
						let health = entities.getComponent(combat.target, 'health');

						if(health)
							health.val -= 1;
					}

					combat.projectileCount--;

					entities.emitter.removeListener("flightpathRemove", dealDamage);
				}
			});
    	},
    	650
    )
}


//client event listeners
entities.emitter.on('combatCreate', entity =>
{
	let client = entities.getComponent(entity, "client");
	let combat = entities.getComponent(entity, "combat");

	combat.emitter.on('newTarget', targetEntity =>
	{
		combat.target = targetEntity;

		//model grabbing
		let targetModel = entities.getComponent(combat.target, "model");
		let playerModel = entities.getComponent(entity,        "model");

		if(client)
			client.send(
				'faceTowards',
				new THREE.Quaternion().setFromEuler(
					new THREE.Euler(0, 0, Math.atan2(
							targetModel.position.y - playerModel.position.y,
							targetModel.position.x - playerModel.position.x
						)
					)
				).toArray()
			);

		broadcast('readyingAnimation');
	});

	combat.emitter.on('launchAttack', attackData =>
	{
		//player components
		let combat 		= entities.getComponent(entity, "combat");
		let playerModel = entities.getComponent(entity, "model");

		//make sure the target hasn't already been killed
		if(shouldFire(combat))
		{
			let targetModel = entities.getComponent(combat.target, "model");
			let direction = Math.atan2(
				targetModel.position.y - playerModel.position.y,
				targetModel.position.x - playerModel.position.x
			);

			//check to see if they're in the right position until they are, then shoot.
			(function positionCheck()
			{
				//get new playermodel, with updated position
				let playerModel = entities.getComponent(entity, "model");
				let playerDirection = playerModel.rotation.z;

				if(playerDirection < direction + 0.01 || playerDirection > direction - 0.01)
				{
					//make sure the target hasn't died since the last time we checked
					//to see if they were there
					if(shouldFire(combat))
						attack(entity)
						
				}

				else if(shouldFire(combat))
					setTimeout(positionCheck, 100);
			})();
		}
	});
});


//transferring events from a client to their combat emitter
entities.emitter.on('clientCreate', entity =>
{
	let client = entities.getComponent(entity, "client");
	entities.addComponent(entity, "combat");

	[
		'launchAttack',
		'newTarget'
	].forEach(eventName =>
		client.on(eventName, data =>
			entities.getComponent(entity, "combat").emitter.emit(eventName, data)
		)
	);
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