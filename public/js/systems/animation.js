define(['../lib/three.js'], function(THREE)
{
	//helper functions
	function initializeAnimation(entity)
	{
		let model 	  = entities.getComponent(entity, "model");
		let animation = entities.getComponent(entity, "animation");

		animation.mixer = new THREE.AnimationMixer(model);
		animation.initialized = true;

		entities.emitter.emit('animationInit', entity);
	}

	//listeners
	entities.emitter.on('animationCreate', entity =>
	{
		let animation = entities.getComponent(entity, "animation");
		let model = entities.getComponent(entity, "model");

		if(model)
			initializeAnimation(entity);

		else
			entities.emitter.on('modelCreate', function addAnimationIfRightModel(modelEntity)
			{
				if(entity === modelEntity)
				{
					new Promise(resolve => resolve()).then(() =>
					{
						initializeAnimation(entity);

						entities.emitter.removeListener('modelCreate', addAnimationIfRightModel);
					});
				}
			});
	});

	//ECS output
	return {
		componentTypesAffected: ["animation"],
		searchName: "animation",
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}), 
		update: (entity, delta) =>
		{
			let animation = entities.getComponent(entity, "animation");

			if(animation.active)
				animation.mixer.update(delta);
		}
	}
});