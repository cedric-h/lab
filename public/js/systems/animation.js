define(['../lib/three.js'], function(THREE)
{
	entities.emitter.on('animationCreate', entity =>
	{
		let animation = entities.getComponent(entity, "animation");

		animation.mixer = new THREE.AnimationMixer(entities.getComponent(entity, "model"));
		animation.initialized = true;
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