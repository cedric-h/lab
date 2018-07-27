define(['../lib/three.js'], function(THREE)
{
	var serverUpdateCounter = 0;

	//function that manipulates keyMap
	const updateKeyMap = event =>
	{
		//also, make it so that this thing only gets called when a key that
		//we actually care about is pressed.
		let entity = entities.find("movementControls")[0];
		let movement 			= entities.getComponent(entity, "movement");
		let moveControls 		= entities.getComponent(entity, "movementControls");
		let camera 	 			= entities.getComponent(entity, "cameraControls");
		let velocityParameters 	= entities.getComponent(entity, "velocityParameters");

		//unfortunately, blocking ctrl-w only works when they're full screened.
		//(in Chrome at least)
		if(event.ctrlKey && event.key === 'w')
			event.preventDefault();
		
		//record the new keypress
		moveControls.keyMap[event.key].isPressed = event.type === "keydown";

		if(moveControls.enabled)
		{
			//update direction
			//get which keys are pressed
			let keysPressed = Object.values(moveControls.keyMap).filter(key => key.isPressed);

			if(keysPressed.length > 0)
			{
				//this will kickstart movementUpdate
				movement.active = true;

				//combine the quaternion for the first two keys that are pressed
				moveControls.keysDirection = keysPressed[0].direction.clone();
				if(keysPressed[1])
					moveControls.keysDirection.slerp(keysPressed[1].direction, 0.5);

				//update the character's bearings now that keysDirection has changed.
				movement.direction.multiplyQuaternions(moveControls.keysDirection, camera.quaternion);
				movement.euler.setFromQuaternion(movement.direction);
			}

			else
			{
				//this will stop movementUpdate from continuing to try to move the guy.
				movement.active = false;
			}

			//movement.active could've just been set to true or false,
			//but we want it to be the opposite of movement.active because
			//if they're moving, no friction, if they are, friction.
			velocityParameters.frictionOn = !movement.active;
		}
	}


	//clientside prediction against noclipping.
	//this will be enforced on the server as well, but without this
	//the walls will feel mushy because the server will have to teleport you out repeatedly. 
	function handleWallCollisions(collisions)
	{
		let entity = entities.find("movementControls")[0];
		let velocityParameters = entities.getComponent(entity, "velocityParameters");
		let velocity 		   = entities.getComponent(entity, "velocity");
		let model 	 	 	   = entities.getComponent(entity, "model");
		let hitbox 		 	   = entities.getComponent(entity, "hitbox");

		let thingsToTeleportOutOfWall = velocityParameters.dependents.slice();
		thingsToTeleportOutOfWall.push(entity);

		//filter so that there's only one collision per face
		let filteredCollisions = [];
		collisions.forEach(collision =>
		{
			if(filteredCollisions.every(x => x.faceIndex !== collision.faceIndex))
				//if(collision.length < 0.8)
					filteredCollisions.push(collision);

			//if collision with this face has already been recorded
			else
				filteredCollisions.forEach((filteredCollision, index) =>
				{
					//find the collision with that face,
					if(filteredCollision === collision)
						//if this one's distance is shorter.
						if(collision.distance < filteredCollision.distance)
							//swap the filtered one in for this one
							filteredCollisions[index] = collision;
				});
		});

		if(filteredCollisions.length > 0)
		{
			filteredCollisions.forEach(collision =>
			{
				//vector of how much to move based on where the wall points and how deep they are in it.
				let teleportationVector = collision.face.normal.clone();
				teleportationVector.z *= -1;
				teleportationVector.multiplyScalar(
					collision.sourceRay.far - collision.distance
				);

				//teleport the player out of the wall
				thingsToTeleportOutOfWall.forEach(thingToTeleport =>
					entities.getComponent(thingToTeleport, "model").position.sub(teleportationVector)
				);
			});

			//kill their velocity
			velocity.set(0, 0, 0);
		}


		//do the collision differently, if collision is detected still teleport them out but
		//set the movement direction to something parallel to the face collided with...
		//then have the direction stuff relative to the orientation over that plane.
		//probably going to have to do a lot of configuration to the movement system to make that
		//possible, but that's okay.
		//--
		//a good place to start would be to set it up so that the rays are a bit longer than
		//they need to be, but then only push the player out of whatever they're in if the rays are
		//a certain depth in... if only the tips of the rays detect collision, keep the guy
		//moving relative to the plane he's on. if that ray stops detecting collision with that plane
		//apply gravity again. (until he collides with a new plane)
		//--
		//you could detect collision with multiple planes, though... how could you move on
		//top of all of them?
	}


	//turning on event listeners once the movementControls entity is created
	entities.emitter.once('movementControlsCreate', entity =>
	{
		let moveControls 		= entities.getComponent(entity, "movementControls");
		let movement 			= entities.getComponent(entity, "movement");
		let hitbox	 	 		= entities.getComponent(entity, "hitbox");

		//event listeners for keeping keyMap up to date
		window.addEventListener('keydown', event =>
		{
			if(moveControls.keyMap.hasOwnProperty(event.key) && moveControls.keyMap[event.key].isPressed !== true)
				updateKeyMap(event);
		});
		window.addEventListener('keyup', event =>
		{
			if(moveControls.keyMap.hasOwnProperty(event.key))
				updateKeyMap(event);
		});

		//assign handleWallCollisions
		hitbox.emitter.on('collision', handleWallCollisions);
		
		hitbox.emitter.on('enter', () =>
		{
			entities.getComponent(entity, "velocityParameters").gravityOn = false;
		});
		hitbox.emitter.on('exit', () =>
		{
			entities.getComponent(entity, "velocityParameters").gravityOn = true;
		});
	});


	//ECS output
	return {
		componentTypesAffected: ['movementControls', "movement"],
		searchName: "movementControls",
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}),
		update: (entity, delta) =>
		{
			let model 		 = entities.getComponent(entity, 'model');
			let movement	 = entities.getComponent(entity, 'movement');
			let moveControls = entities.getComponent(entity, 'movementControls');

			serverUpdateCounter += delta;

			if(serverUpdateCounter > moveControls.updateServerEvery)
			{
				moveControls.updateServerEvery = 0;

				//get that new direction data to the server
				moveControls.serverData = {
					//orientation
					position: 		model.position 	  .toArray(),
					quaternion: 	model.quaternion  .toArray(),
					//movement stuff
					direction: 		movement.direction.toArray(),
					currentSpeed: 	movement.currentSpeed,
					active:     	movement.active
				}
				server.emit('movementUpdate', moveControls.serverData);
			}
		}
	}
});