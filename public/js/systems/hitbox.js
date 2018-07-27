define(['../lib/three.js'], function(THREE)
{
	//configure the player's hitbox component once it's instantiated.
	entities.emitter.on('movementControlsCreate', entity =>
	{
		let hitbox = entities.getComponent(entity, "hitbox");

		//configure the hitbox to fit the player
		//later this will scale automatically to the player.

		//make the ends for the rays
		for(		let x = -1; x <= 1; x += 1/hitbox.rayDensity.x)
			for(	let y = -1; y <= 1; y += 1/hitbox.rayDensity.y)
				for(let z = -1; z <= 1; z += 1/hitbox.rayDensity.z)
					hitbox.rayDirections.push(
						new THREE.Vector3(x, y, z).multiply(hitbox.scale).normalize()
					);

		//then wait until the model is loaded.
		let model = entities.getComponent(entity, "model");

		//grab the center object, or in the player's case, the torso.
		hitbox.centerObject = model.skeleton.getBoneByName('Torso');

		//update center position
		hitbox.centerObject.localToWorld(
			hitbox.centerPosition.copy(hitbox.centerObject.position)
		);

		//get the rays from the directions and the center.
		hitbox.rayDirections.forEach(direction =>
			{
				let rayLength = direction.clone().multiply(hitbox.rayLengths).length();
				hitbox.rays.push(
					new THREE.Raycaster(hitbox.centerPosition, direction, 0, rayLength)
				);
				//model.add(new THREE.ArrowHelper(direction, hitbox.centerPosition, rayLength));
			}
		);
	});

	//ECS output
	return {
		componentTypesAffected: ['hitbox', 'movementControls'],
		searchName: "playerHitbox",
		load: new Promise((resolve, reject) => resolve()),
		update: (entity, delta) =>
		{
			let model 	  = entities.getComponent(entity, "model");
			let hitbox = entities.getComponent(entity, "hitbox");

			//get the map's model in a really hacky stupid way
			let map = entities.getComponent(entities.find("collidable")[0], "collidable");

			let didCollide = false;
			let collisions = [];

	
			//update center position if the hitbox.rays have been made yet.
			if(hitbox.rays.length > 0)
				hitbox.centerObject.localToWorld(
					hitbox.centerPosition.copy(hitbox.centerObject.position)
				);

			//check to see if collision occured

			//see if the hitbox.rays have collided with anything.
			for(let index in hitbox.rays)
			{
				let ray = hitbox.rays[index];

				//update ray
				ray.set(hitbox.centerPosition, hitbox.rayDirections[index]);

				//check to see if the ray intersects the map
				let collisionsFromThisRay = ray.intersectObject(map, true);

				if(collisionsFromThisRay.length > 0)
				{
					//push the closest thing collided with into collisions
					let closestCollision = collisionsFromThisRay[0];
					closestCollision.sourceRay = ray;
					collisions.push(closestCollision);
					didCollide = true;
				}
			}


			//if any sort of collision occured, emit that
			if(didCollide)
				hitbox.emitter.emit("collision", collisions);
			
			//if the collision status changed, emit an event reflecting the change
			if(didCollide !== hitbox.isColliding)
			{
				hitbox.emitter.emit(didCollide ? "enter" : "exit", collisions);
				hitbox.isColliding = didCollide;
			}
		}
	}
});