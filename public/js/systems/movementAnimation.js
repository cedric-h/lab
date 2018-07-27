define(['../lib/three.js'], function(THREE)
{
	//variable declaration
	var walking;


	//event listener for setting up animation stuff when the playermodel loads
	entities.emitter.on('movementCreate', entity =>
	{
		let movement 	= entities.getComponent(entity, "movement");
		let playerModel = entities.getComponent(entity, "model");
		let animation 	= entities.getComponent(entity, "animation");

		if(movement && playerModel && animation)
			walking = animation.mixer.clipAction(
				THREE.AnimationClip.findByName(playerModel.geometry.animations, "run")
			).play();
	});


	//ECS output
	return {
		componentTypesAffected: ['movement', 'animation'],
		searchName: "movementAnimation",
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}),
		update: (entity, delta) =>
		{
			let movement  = entities.getComponent(entity, "movement");
			let animation = entities.getComponent(entity, "animation");

			if(movement.active && animation.initialized)
				walking.setEffectiveWeight(
					Math.min(movement.currentSpeed/movement.maxSpeed * 2.6, 1)
				);

			else
			{
				//if the walking animation has been instantiated
				if(walking)
				{
					//console.log(movement.currentSpeed, movement.maxSpeed);
					if(walking.weight !== 0 && movement.currentSpeed === 0)
						walking.setEffectiveWeight(0);

					else
						walking.setEffectiveWeight(
							Math.min(movement.currentSpeed/movement.maxSpeed * 2.6, 1)
						);
				}
			}
		}
	}
});