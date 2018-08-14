define(['../lib/three.js', '../util/closestEntity.js'], function(THREE, closestEntity)
{
	//helper functions

	//switch targeted entity
	function switchTargetedTo(targetEntity)
	{
		let targeted = entities.find('targeted');

		if(targeted.length === 1)
			entities.removeComponent(targeted[0], "targeted");

		else if(targeted.length > 1)
			throw new Error('there should only be one targeted playerEntity');

		entities.addComponent(targetEntity, "targeted");
	}

	function addKeyPressListener(playerEntity)
	{
		let weapon = entities.getComponent(playerEntity, 'weapon');

		window.addEventListener('keydown', event =>
		{
			let keyIndex = parseInt(event.key) - 1;

			if(weapon.attacks.hasOwnProperty(keyIndex))
			{
				event.preventDefault();

				let targetables = entities.find('targetable');

				if(targetables.length > 0)
				{
					//target closest entity
					let targetEntity = closestEntity(
						entities.getComponent(playerEntity, "model").position,
						targetables
					);
					switchTargetedTo(targetEntity);

					//tell server
					server.emit('toggleAttackOn', {
						target: 	 entities.getComponent(targetEntity, "serverId"),
						attackIndex: keyIndex
					});
				}
			}

			if(event.key.toLowerCase() === 'e')
				server.emit('interact');

			if(event.key === ";")
				server.emit('printPosition');
		});
	}


	//event listeners
	entities.emitter.on('movementControlsCreate', entity =>
	{
		entities.emitter.on('weaponStatsAssigned', function waitUntilStats(weaponEntity)
		{
			if(weaponEntity === entity)
			{
				addKeyPressListener(entity);
				entities.emitter.removeListener('weaponStatsAssigned', waitUntilStats);
			}
		})
	});

	entities.emitter.on('targetedRemove', removedModelEntity =>
	{
		let movement = entities.getComponent(
			entities.find('movementControls')[0], 
			'movement'
		);

		if(movement.faceTowardsEntity === removedModelEntity)
		{
			movement.faceTowardsEntity = undefined;
			movement.directionOverride = false;
		}
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