define(['../lib/three.js'], THREE =>
{
	//general purpose helper function
	const mod = (a, n) => a - Math.floor(a/n) * n;


	//ECS export
	return {
		//serverAndClient: true,
		componentTypesAffected: ["movement", "movementControls"],
		searchName: 'movementUpdate',
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}),
		update: (entity, delta) =>
		{
			let velocity			= entities.getComponent(entity, "velocity");
			let movement			= entities.getComponent(entity, "movement");
			let moveControls		= entities.getComponent(entity, "movementControls");
			let velocityParameters	= entities.getComponent(entity, "velocityParameters");
			let model  				= entities.getComponent(entity, "model");

			//animate the guy rotating to face movement.direction, if necessary
			if(movement.active || movement.directionOverride)
			{
				let direction = movement.direction;
				let euler = movement.euler;

				if(movement.directionOverride && entities.find('model').indexOf(movement.faceTowardsEntity) !== -1)
				{
					let targetPos = entities.getComponent(movement.faceTowardsEntity, "model").position;

					euler = new THREE.Euler(0, 0, Math.atan2(
							targetPos.y - model.position.y,
							targetPos.x - model.position.x
						)
					);

					direction = new THREE.Quaternion().setFromEuler(euler);

					//console.log('setting direction and euler');
				}

				if(!model.quaternion.equals(direction))
				{
					//console.log('lerping');

					//I want rotation that happens because of the camera pointing somewhere else
					//to feel smoother, so it doesn't get a head start like directionOverride
					//(the rotationAnimProg could get set to 0 in the next clause)
					if(!movement.directionOverride)
						movement.rotationAnimProg += delta;

					//if we're trying to rotate to a different place now
					if(!direction.equals(movement.goalDirection))
					{	
						movement.rotationAnimProg = 0;

						//calculate how long it should take to do the turn based on the space between the two rotations
						movement.rotationAnimTime = Math.abs(mod((model.rotation.z - euler.z) + Math.PI, Math.PI*2) - Math.PI);
						movement.rotationAnimTime*= movement.rotationSpeed;

						movement.startDirection	 = model.quaternion.clone();
						movement.goalDirection	 = direction.clone();
					}

					//animation that happens because of direction override should be snappier,
					//so it gets a head start even when it was just set to 0
					if(movement.directionOverride)
						movement.rotationAnimProg += delta;

					//interpolate
					let progress = (movement.rotationAnimProg/movement.rotationAnimTime);
					THREE.Quaternion.slerp(
						movement.startDirection,		//start (where we were last time the movement.goalDirection changed)
						direction,				//end (current cam * keys quaternion)
						model.quaternion,				//is set to result
						(progress > 1) ? 1 : progress	//distance percentage between start and end
					);
				}
			}


			if(movement.active)
			{
				//speed
				//increase speed
				movement.currentSpeed += (movement.maxSpeed/movement.secondsToMax) * delta;

				//cap it if it's over max speed
				if(movement.currentSpeed >= movement.maxSpeed)
					movement.currentSpeed = movement.maxSpeed;


				//velocity
				//setting his velocity to a vector representing the speed and direction in any given dimension
				if(moveControls !== undefined && moveControls.overrideActive)
					velocity.copy(moveControls.velocityOverride);

				else
					velocity.set(
						Math.cos(model.rotation.z) * movement.currentSpeed,
						Math.sin(model.rotation.z) * movement.currentSpeed,
						0
					);
			}
		}
	}
})