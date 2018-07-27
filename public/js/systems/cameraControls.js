define(['../lib/three.js'], function(THREE)
{
	//general purpose helper functions
	const mod = (a, n) => a - Math.floor(a/n) * n;

	//make it go from -Math.PI to Math.PI
	//for degrees plebs, that's (-180 to 180) but in radians
	const normalizeAngle = angle =>
	{
		angle = angle % Math.PI*2;

		angle = (angle + Math.PI*2) % Math.PI*2;

		if (angle > Math.PI)
			angle -= Math.PI*2;

		return angle;
	}


	//var declaration
	var relativeCamPosition = new THREE.Vector3();
	var focalPoint 			= new THREE.Vector3();
	var camRaycaster = new THREE.Raycaster();


	//specific helper functions
	function updatePosition(playerEntity)
	{
		let camControls  = entities.getComponent(playerEntity, 		 "cameraControls");
		let moveControls = entities.getComponent(playerEntity, 		 "movementControls");
		let movement 	 = entities.getComponent(playerEntity, 		 "movement");
		let camModel	 = entities.getComponent(camControls.entity, "model");
		let playerModel  = entities.getComponent(playerEntity, 		 "model");

		//this sets the cam's position to the position of the entity it is a component of.
		camModel.position.copy(playerModel.position);

		//begin to reposition the cam by adding the offset, which is another Vector3
		camModel.position.add(camControls.offset);


		//now reposition according to the radius and rotations.
		relativeCamPosition.set(
			Math.sin(camControls.rotations.y) * Math.cos(camControls.rotations.x),
			Math.sin(camControls.rotations.y) * Math.sin(camControls.rotations.x),
			Math.cos(camControls.rotations.y)
		);
		focalPoint.addVectors(playerModel.position, camControls.offset);

		//use relativeCamPosition as a unit vector to initialize the ray caster
		camRaycaster.set(focalPoint, relativeCamPosition);

		//now give relativeCamPosition the appropriate magnitude and use it to reposition the camera.
		relativeCamPosition.multiplyScalar(camControls.radius);
		camModel.position.add(relativeCamPosition);

		camModel.lookAt(focalPoint);


		//get the map in a really hacky stupid way
		let map = entities.getComponent(entities.find("collidable")[0], "collidable");

		let collision = camRaycaster.intersectObject(map, true)[0];
		if(collision)
			camModel.position.copy(collision.point.sub(relativeCamPosition.multiplyScalar(0.1)));


		//store quaternion which is used by movementControl.js
		camControls.quaternion.setFromEuler(new THREE.Euler(0, 0, camControls.rotations.x));

		//update the local player's bearings accordingly
		if(!movement.directionOverride)
			movement.direction.multiplyQuaternions(moveControls.keysDirection, camControls.quaternion);
			movement.euler.setFromQuaternion(movement.direction);
	}

	function alterRotation(event)
	{
		let mouseControlledEntity = entities.find("cameraControls")[0];		
		if(mouseControlledEntity || mouseControlledEntity === 0)
		{
			let camController = entities.getComponent(mouseControlledEntity, "cameraControls");
			let incrementedY = camController.rotations.y + event.movementY * camController.sensitivity.y;

			camController.rotations.x = camController.rotations.x + event.movementX * camController.sensitivity.x;
			camController.rotations.y = (incrementedY < Math.PI && incrementedY > 0) ? incrementedY : camController.rotations.y;

			updatePosition(mouseControlledEntity);
		}
	}


	//event listeners for locking mouse
	document.body.onclick = function() {
	  document.body.requestPointerLock();
	};

	document.addEventListener('pointerlockchange', manageEventListener);
	document.addEventListener('mozpointerlockchange', manageEventListener);

	function manageEventListener()
	{
		if (!!document.pointerLockElement || !!document.mozPointerLockElement)
			document.addEventListener("mousemove", alterRotation);

		else
			document.removeEventListener("mousemove", alterRotation);
	}


	//event listeners for starting the cam controls once everything is loaded
	entities.emitter.once('cameraControlsCreate', (entity) =>
	{
		//wait just a skip for the other components to be assigned
		new Promise(resolve => resolve()).then(() =>
		{
			let camController = entities.getComponent(entity, "cameraControls");

			//could've done this in the component using one line with an assemblage...
			//still haven't made assemblages yet, though...
			camController.entity = entities.create();
			entities.addComponent(camController.entity, "modelName");
			entities.setComponent(camController.entity, "modelName", "camera");
			entities.addComponent(camController.entity, "model");

			let camModel 	  = entities.getComponent(camController.entity, "model");
			let playerVelPars = entities.getComponent(entity,				"velocityParameters");
			//make the camera move with the player
			playerVelPars.dependents.push(camController.entity);

			//once the cam's loaded, we can position the camera and animate if need be.
			updatePosition(entity);

			camRaycaster.far = camController.radius;
		});
	});


	//ECS data shipped out
	return {
		componentTypesAffected: ["cameraControls"],
		searchName: "cameraControls",
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}),
		update: (entity, delta) => //				update cam position every frame,
		//					 						feels nice but performance RIP
		{
			let camEntity = entities.getComponent(entity, "cameraControls").entity;
			if(camEntity && typeof entities.getComponent(camEntity, "model") !== "string")
				updatePosition(entity);
		}
	}
});