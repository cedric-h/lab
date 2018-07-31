define(['../lib/three.js'], function(THREE)
{
	//assign that listener
	entities.emitter.on('weaponEquip', entity =>
	{
		if(!entities.getComponent(entity, "weapon").animation)
		{
			let playerModel = entities.getComponent(entity, "model");
			let weapon 		= entities.getComponent(entity, "weapon");
			let animation 	= entities.getComponent(entity, "animation");

			//grab the readying animation from the model's data
			let readyClip = THREE.AnimationClip.findByName(playerModel.geometry.animations, "shoot");

			if(readyClip)
			{
				weapon.animation = animation.mixer.clipAction(readyClip);

				//configure the readying animation
				weapon.animation.loop = THREE.LoopOnce;
				weapon.animation.clampWhenFinished = true;
			}
		}
	});


	//event listeners that pertain to starting and stopping the animation
	server.on('dereadyingAnimation', () =>
		entities.getComponent(
			entities.find('movementControls')[0],
			"weapon"
		).shouldStop = true
	);

	server.on('readyingAnimation', () =>
	{
		let localEntity = entities.find('movementControls')[0];

		let weapon 			 = entities.getComponent(localEntity, "weapon");
		let movementControls = entities.getComponent(localEntity, "movementControls");
		let velocity 		 = entities.getComponent(localEntity, "velocity");
		let movement 		 = entities.getComponent(localEntity, "movement");

		weapon.targetPosition.copy(
			entities.getComponent(entities.find('targeted')[0], "model").position
		);

		if(!weapon.isUp && !weapon.isMoving)
			weapon.shouldShoot = true;

		movementControls.blocked = true;
		movement.active = false;
		movement.currentSpeed = 0;
		velocity.set(0, 0, 0);

		entities.emitter.on('movementControlsBlocked', function unblockControls()
		{
			let weapon = entities.getComponent(localEntity, 'weapon');

			if(!weapon.isMoving)
			{
				weapon.shouldStop = true;

				entities.emitter.removeListener('movementControlsBlocked', unblockControls);
			}
		});
	});


	//event listener for repositioning the gun.
	server.on('aimWeaponAt', data =>
	{
		//find the local entity with that server id

		entities.getComponent(
			entities.find('serverId').filter(
				entity => entities.getComponent(entity, "serverId") === data.attackerEntity
			),
			"weapon"
		).targetPosition.fromArray(data.targetPosition);
	});


	//sticking the weapons in their hands
	entities.emitter.on('prerender', () =>
	{
		entities.find('weapon').forEach(entity =>
		{
			let weapon = entities.getComponent(entity, "weapon");

			if(weapon.model !== undefined)
			{
				let model = entities.getComponent(entity, "model");
				let weaponBone  = model.skeleton.getBoneByName('weapon');

				model.updateMatrixWorld();
				weapon.model.position.setFromMatrixPosition(weaponBone.matrixWorld);

				//apply the position adjustmnents in weaponPositionAdjustments.json
				if(weapon.adjustments.position)
					weapon.model.position.add(weapon.adjustments.position);

				//manage pointing the gun at the targeted entity
				let targeted = entities.find('targeted')[0];

				if(weapon.isUp && targeted)
				{
					let targetModel = entities.getComponent(targeted, 'model');
					weapon.model.lookAt(weapon.targetPosition);
				}

				//have the gun act as if it was just a child of the weaponBone
				else
				{
					weaponBone.getWorldQuaternion(weapon.model.quaternion);

					if(weapon.adjustments.rotation)
						weapon.model.quaternion.multiply(weapon.adjustments.rotation);
				}
			}
		})
	})
	

	//ECS output
	return {
		componentTypesAffected: ['weapon', 'model'],
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}), 
		update: (entity, delta) =>
		{
			let weapon 			 = entities.getComponent(entity, "weapon");
			let movementControls = entities.getComponent(entity, "movementControls");

			if(!weapon.isMoving)
			{
				let animation = entities.getComponent(entity, "animation");

				if(weapon.shouldShoot && !weapon.isUp)
				{
					weapon.shouldShoot = false;
					weapon.isMoving  = true;

					//play the animation
					weapon.animation.reset().play();
					weapon.animation.setEffectiveWeight(1);

					//then, then the animation is finished...
					//pause and prepare to play backwards.
					animation.mixer.addEventListener('finished', function pause(event)
					{
						if(event.action === weapon.animation)
						{
							animation.mixer.removeEventListener('finished', pause);

							weapon.isMoving = false;
							weapon.isUp = true;
							weapon.shouldStop = false;

							//set up the animation
							weapon.animation.reset().play().setEffectiveTimeScale(-1);
							weapon.animation.paused = true;
						}
					});
				}

				if(weapon.shouldStop && weapon.isUp)
				{
					weapon.shouldStop = false;
					weapon.isMoving = true;

					weapon.animation.paused = false;

					if(movementControls)
					{
						setTimeout(
							() => movementControls.blocked = false,
							weapon.animation.getClip().duration * 1000 * 0.8
						)
					}

					//and set things back to normal once the animation is done playing backwards.
					animation.mixer.addEventListener('finished', function stopAnimation(event)
					{
						if(event.action === weapon.animation)
						{
							animation.mixer.removeEventListener('finished', stopAnimation);

							weapon.isMoving = false;
							weapon.isUp = false;

							weapon.animation.setEffectiveTimeScale(1);
							weapon.animation.setEffectiveWeight(0);
						}								
					});
				}
			}
		}
	}
});