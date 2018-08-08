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

    function prepareAnimation(entity)
    {
    	let model 	  = entities.getComponent(entity, "model");
		let weapon 	  = entities.getComponent(entity, "weapon");
		let animation = entities.getComponent(entity, "animation");

		//grab the readying animation from the model's data
		let readyClip = THREE.AnimationClip.findByName(model.geometry.animations, weapon.type);

		if(readyClip)
		{
			weapon.animation = animation.mixer.clipAction(readyClip);

			//configure the readying animation
			weapon.animation.loop = THREE.LoopOnce;
			weapon.animation.clampWhenFinished = true;
		}
    }


	//prepare weapon animations when a weapon is equipped
	entities.emitter.on('weaponEquip', entity =>
	{
		if(!entities.getComponent(entity, "weapon").animation)
		{
			let animation = entities.getComponent(entity, "animation");

			if(animation.initialized)
				prepareAnimation(entity);

			else
				new Promise(resolve => resolve()).then(() =>
					prepareAnimation(entity)
				);
		}
	});


	//event listeners that pertain to starting and stopping the animation
	server.on('targetingUpdate', data =>
	{
		let attackerEntity = entityWithId(data.attackerEntity);
		let targetEntity = entityWithId(data.targetEntity);

		if(targetEntity !== undefined && attackerEntity !== undefined)
		{
			let weapon = entities.getComponent(attackerEntity, "weapon");

			if(!weapon.isUp && !weapon.isMoving)
			{
				weapon.shouldShoot = true;

				if(attackerEntity === entities.find('movementControls')[0])
				{
					let movement 		 = entities.getComponent(attackerEntity, "movement");
					let velocity 		 = entities.getComponent(attackerEntity, "velocity");
					let movementControls = entities.getComponent(attackerEntity, "movementControls");

					movementControls.blocked = true;
					movement.active = false;
					movement.currentSpeed = 0;
					velocity.set(0, 0, 0);

					entities.emitter.on('movementControlsBlocked', function unblockControls()
					{
						let weapon = entities.getComponent(attackerEntity, 'weapon');

						if(!weapon.isMoving)
						{
							weapon.shouldStop = true;

							entities.emitter.removeListener(
								'movementControlsBlocked',
								unblockControls
							);
						}
					});
				}
			}
		}
	});


	//event listeners on server for animations

	//melee
	server.on('meleeAttack', attackerServerId =>
	{
		let attackerEntity = entityWithId(attackerServerId);

		if(attackerEntity)
		{
			let weapon = entities.getComponent(attackerEntity, 'weapon');
			weapon.animation.reset().play();
		}
	});

	//ranged
	server.on('aimWeaponAt', data =>
	{
		let attackerEntity = entityWithId(data.attackerEntity);

		if(attackerEntity !== undefined)
		{
			let weapon = entities.getComponent(attackerEntity, "weapon");

			weapon.targetPos.fromArray(data.targetPos);
			weapon.targetPosUpdated = true;
		}
	});
	server.on('targetingUpdate', data =>
	{
		let attackerEntity = entityWithId(data.attackerEntity);

		if(attackerEntity !== undefined)
		{
			let weapon   = entities.getComponent(attackerEntity, "weapon");
			let movement = entities.getComponent(attackerEntity, "movement");

			weapon.targetEntity = entityWithId(data.targetEntity);
			weapon.targetPosUpdated = false;

			if(attackerEntity === entities.find('movementControls')[0])
			{
				movement.faceTowardsEntity = weapon.targetEntity;
				movement.directionOverride = true;
			}
		}
	});


	//clear out targetEntities if the entity dies
	entities.emitter.on('modelRemove', removedModelEntity =>
	{
		entities.find('weapon').forEach(weaponEntity =>
		{
			let weapon = entities.getComponent(weaponEntity, "weapon");

			if(weapon.targetEntity === removedModelEntity)
				weapon.targetEntity = undefined;
		});
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
				if(weapon.isUp && weapon.targetEntity !== undefined)
				{
					if(weapon.targetPosUpdated)
						weapon.model.lookAt(weapon.targetPos);

					else
						weapon.model.lookAt(
							entities.getComponent(weapon.targetEntity, "model").position
						);
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
	});
	

	//ECS output
	return {
		componentTypesAffected: ['weapon', 'model'],
		searchName: ['weaponsToAnimate'],
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}), 
		update: (entity, delta) =>
		{
			let weapon 			 = entities.getComponent(entity, "weapon");
			let movementControls = entities.getComponent(entity, "movementControls");

			if(weapon.type === "ranged" && !weapon.isMoving)
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
							() =>
							{
								movementControls.blocked = false;
								entities.getComponent(entity, "movement").directionOverride = false;
							},
							weapon.animation.getClip().duration * 1000 * 0.2
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

							server.emit('readiedNoLonger');

							weapon.animation.setEffectiveTimeScale(1);
							weapon.animation.setEffectiveWeight(0);
						}								
					});
				}
			}
		}
	}
});