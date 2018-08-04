define(['../lib/three.js'], function(THREE)
{
	function addRunningAnimation(entity)
	{
		let movement  = entities.getComponent(entity, "movement");
		let model 	  = entities.getComponent(entity, "model");
		let animation = entities.getComponent(entity, "animation");

		let runClip = THREE.AnimationClip.findByName(
			model.geometry.animations,
			"run"
		);

		if(runClip)
			movement.animation = animation.mixer.clipAction(runClip).play();
	}


	//event listener for setting up animation stuff when the playermodel loads
	entities.emitter.on('movementCreate', entity =>
	{
		let animation 	= entities.getComponent(entity, "animation");

		if(animation.initialized)
			addRunningAnimation(entity);

		else
			entities.emitter.on('animationInit', function addOnInit(animationInitEntity)
			{
				if(entity === animationInitEntity)
				{
					addRunningAnimation(entity)
					entities.emitter.removeListener('animationInit', addOnInit);
				}
			});
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
			let movement   		 = entities.getComponent(entity, "movement");
			let animation 		 = entities.getComponent(entity, "animation");
			let movementControls = entities.getComponent(entity, "movementControls");
			

			//playing animation
			if((movement.active || movementControls === undefined) && animation.initialized)
				movement.animation.setEffectiveWeight(
					Math.min(movement.currentSpeed/movement.maxSpeed * 2.6, 1)
				);

			else
			{
				//if the movement.animation has been instantiated
				if(movement.animation)
				{
					//console.log(movement.currentSpeed, movement.maxSpeed);
					if(movement.animation.weight !== 0 && movement.currentSpeed === 0)
						movement.animation.setEffectiveWeight(0);

					else
						movement.animation.setEffectiveWeight(
							Math.min(movement.currentSpeed/movement.maxSpeed * 2.6, 1)
						);
				}
			}
		}
	}
});