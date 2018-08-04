define(['../lib/three.js', '../util/closestEntity.js'], function(THREE, closestEntity)
{
	entities.emitter.on('movementControlsCreate', () =>
	{
		//do stuff when the mouse is clicked.
		window.addEventListener('keydown', event =>
		{
			if(event.key === "Tab")
			{
				event.preventDefault();

				let entity = entities.find('movementControls')[0];
				let model  = entities.getComponent(entity, "model");

				let targets = entities.find('targetable');

				if(targets.length > 0)
				{	
					let targetEntity = closestEntity(model.position, targets);
					let targetModel = entities.getComponent(targetEntity, "model");

					//switch targeted entity
					let targeted = entities.find('targeted');

					if(targeted.length === 1)
						entities.removeComponent(targeted[0], "targeted");

					else if(targeted.length > 1)
						throw new Error('there should only be one targeted entity');

					entities.addComponent(targetEntity, "targeted");

					//tell server
					server.emit('newTarget', entities.getComponent(targetEntity, "serverId"));
				}
			}

			if(event.key === "1")
			{
				server.emit('launchAttack', {});
			}
		});
	});


	//ECS output
	return {
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}), 
		update: (entity, delta) =>
		{
		}
	}
});