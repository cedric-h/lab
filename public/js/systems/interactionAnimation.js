define(['../lib/three.js'], function(THREE)
{
	//helper functions
    //take a serverId, return the entity with said id
    function entityWithId(serverId)
    {
        let entityFound = undefined;

        entities.find('serverId').forEach(entity =>
        {
            if(entities.getComponent(entity, "serverId") === serverId)
                entityFound = entity;
        });

        return entityFound;
    }

	//listeners
	entities.emitter.on('animationInit', entity =>
	{
		let animation = entities.getComponent(entity, 'animation');
		let model 	  = entities.getComponent(entity, 'model');
		let modelName 	  = entities.getComponent(entity, 'modelName');

		let interactionClip = THREE.AnimationClip.findByName(
			model.geometry.animations,
			"interact"
		);

		if(interactionClip)
		{
			animation.interact = animation.mixer.clipAction(interactionClip);

			//configure the interaction animation
			animation.interact.loop = THREE.LoopOnce;
			animation.interact.clampWhenFinished = true;
		}
	});

	server.on('interaction', serverId =>
	{
		let interactedEntity = entityWithId(serverId);

		let animation = entities.getComponent(interactedEntity, 'animation');

		animation.interact.reset().play();
	});

	//ECS output
	return {
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}), 
		update: (entity, delta) => {}
	}
});