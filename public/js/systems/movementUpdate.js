define(['../lib/three.js'], THREE =>
{
	//general purpose helper function
	const mod = (a, n) => a - Math.floor(a/n) * n;


	server.on('faceTowards', (direction) =>
	{
		let movement = entities.getComponent(
			entities.find('movementControls')[0],
			"movement"
		);

		movement.direction.fromArray(direction);
		movement.euler.setFromQuaternion(movement.direction);
		movement.directionOverride = true;
	});


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
				if(!model.quaternion.equals(movement.direction))
				{
					//increasing this beforehand just because it could get set to zero up ahead,
					//and I don't want the animation to get a headstart of one frame... insane, ik.
					movement.rotationAnimProg += delta;

					//if we're trying to rotate to a different place now
					if(!movement.direction.equals(movement.goalDirection))
					{	
						movement.rotationAnimProg = 0;

						//calculate how long it should take to do the turn based on the space between the two rotations
						movement.rotationAnimTime = Math.abs(mod((model.rotation.z - movement.euler.z) + Math.PI, Math.PI*2) - Math.PI);
						movement.rotationAnimTime*= movement.rotationSpeed;

						movement.startDirection	 = model.quaternion.clone();
						movement.goalDirection	 = movement.direction.clone();
					}

					//interpolate
					let progress = (movement.rotationAnimProg/movement.rotationAnimTime);
					THREE.Quaternion.slerp(
						movement.startDirection,		//start (where we were last time the movement.goalDirection changed)
						movement.direction,				//end (current cam * keys quaternion)
						model.quaternion,				//is set to result
						(progress > 1) ? 1 : progress	//distance percentage between start and end
					);

					if(progress > 1)
						movement.directionOverride = false;
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