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


var preparationTimes = {};


function attack(entity)
{
	let combat 		= entities.getComponent(entity, "combat");
	let playerModel = entities.getComponent(entity, "model");
	let client 		= entities.getComponent(entity, "client");

	//record the firing of this new projectile
	combat.projectileCount++;

	//get the arrow set up
	let arrowEntity = entities.create();
	entities.addComponent(arrowEntity, "model");
	entities.addComponent(arrowEntity, "flightpath");
	let arrowModel = entities.getComponent(arrowEntity, "model");
	let flightpath = entities.getComponent(arrowEntity, "flightpath");

	//get a direction to the targeted entity
	let targetModel = entities.getComponent(combat.target, "model");
	
	arrowModel.position.set(
		0,
		0.3,
		1.17
	);
	playerModel.updateMatrixWorld();
	arrowModel.position.copy(playerModel.localToWorld(arrowModel.position));

	flightpath.start.copy(arrowModel.position);
	flightpath.end.copy(targetModel.position);
	flightpath.speed = 20;
	flightpath.target = combat.target;

	//modify flightpath.end with some juicy randomness
	let size = new THREE.Vector3();
    flightpath.targetBox.setFromArray(
        targetModel.geometry.vertices
    );
    flightpath.targetBox.getSize(size);
    
    flightpath.end.x += (size.x * targetModel.scale.x) * (0.4 - Math.random()*0.8);
    flightpath.end.y += (size.y * targetModel.scale.y) * (0.4 - Math.random()*0.8);
    flightpath.end.z += (size.z * targetModel.scale.z) * (0.2 + Math.random()*0.6);

    arrowModel.lookAt(flightpath.end);


    //doing damage once the arrow is removed.
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


	//bring down their arm
	if(combat.armDownTimeout !== undefined)
		clearTimeout(combat.armDownTimeout);

	combat.armDownTimeout = setTimeout(
		() =>  broadcast('stopShooting'),
		combat.armDownWait
	);


	//let the player know about the new arrow
	client.send('entitySpawn', {
		components: [
			"modelName",
		],
		componentOverrides: {
			serverId: arrowEntity,
			modelName: "arrow"
		},
		position: 	 arrowModel.position  .toArray(),
		quaternion:  arrowModel.quaternion.toArray()
	});
}

const shouldFire = combat =>
	entities.find('model').indexOf(combat.target) !== -1 && combat.projectileCount < 8;


//client event listeners
entities.emitter.on('clientCreate', entity =>
{
	entities.addComponent(entity, "combat");

	let client = entities.getComponent(entity, "client");
	let combat = entities.getComponent(entity, "combat");

	client.on('newTarget', targetEntity =>
	{
		combat.target = targetEntity;
	});

	client.on('launchAttack', attackData =>
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
			)

			client.send(
				'faceTowards',
				new THREE.Quaternion().setFromEuler(
					new THREE.Euler(0, 0, direction)
				).toArray()
			);

			//check to see if they're in the right position until they are, then shoot.
			(function positionCheck()
			{
				//get new playermodel, with updated position
				let playerModel = entities.getComponent(entity, "model");

				if(playerModel.rotation.z.toFixed(5) === direction.toFixed(5))
				{
					client.send('startShooting');
					setTimeout(
						() => 
						{
							//make sure the target hasn't died since the last time we checked
							//to see if they were there
							if(shouldFire(combat))
								attack(entity)
						},
						preparationTimes['bow'] * 1000 + 200
					);
				}

				else if(shouldFire(combat))
					setTimeout(positionCheck, 100);
			})();
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