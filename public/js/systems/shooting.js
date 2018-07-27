define(['../lib/three.js'], function(THREE)
{
	//variable declaration
	var shootingAnimation;


	//prepare animations and models
	const attachWeapon = entity =>
	{
		let shooting = entities.getComponent(entity, "shooting");

		if(typeof shooting.weaponModel === "string")
		{
			//create a separate entity for the weapon
			let wepEntity = entities.create();
			entities.addComponent(wepEntity, "modelName");
			entities.setComponent(wepEntity, "modelName", shooting.weaponModel);
			entities.addComponent(wepEntity, "model");

			//expose it
			shooting.weaponModel = wepEntity;

			//grab the models
			let playerModel = entities.getComponent(entity,		 "model");
	    	let bowModel 	= entities.getComponent(wepEntity, 	 "model");

	    	//grab the hand from the playermodel
	    	let hand = playerModel.skeleton.getBoneByName('Hand 1.l');

	    	//glue the bow to the hand
	    	hand.add(bowModel);

	    	//first step:
	    	//get the models into a /assets/weapons/ file and load 'em up from there in a weapon
	    	//system that works in conjunction with a weapon component which contains the model
	    	//the name of the model, and a bunch of stats that affect the weapon, i.e. its attacks,
	    	//damage, projectile speed, cool down, ect.
	    	//load the model in response to... entities.emitter.on('weaponModelAssign')?
		}
	};

	const prepareAnimation = entity =>
	{
		let playerModel = entities.getComponent(entity, "model");
		let animation 	= entities.getComponent(entity, "animation");

		//grab the shooting animation from the model's data
		shootingAnimation = animation.mixer.clipAction(
			THREE.AnimationClip.findByName(playerModel.geometry.animations, "bow")
		);

		//configure the shooting animation
		shootingAnimation.loop = THREE.LoopOnce;
		shootingAnimation.clampWhenFinished = true;

		//start it but pause it for now, so that it plays when it's .reset()
		//shootingAnimation.play();
		//shootingAnimation.paused = true;
	};


	//assign that listener
	entities.emitter.on('shootingCreate', entity =>
	{
		attachWeapon(entity);

		//loading shooting animation
		prepareAnimation(entity);
	});


	server.on('stopShooting', () =>
		entities.getComponent(
			entities.find('movementControls')[0],
			"shooting"
		).shouldStop = true
	);

	server.on('startShooting', () =>
	{
		let shooting = entities.getComponent(
			entities.find('movementControls')[0],
			"shooting"
		);
		if(!shooting.isUp && !shooting.isMoving)
			shooting.shouldShoot = true;
	})
	

	//ECS output
	return {
		componentTypesAffected: ['shooting', 'model'],
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}), 
		update: (entity, delta) =>
		{
			let shooting = entities.getComponent(entity, "shooting");

			if(!shooting.isMoving)
			{
				let animation = entities.getComponent(entity, "animation");

				if(shooting.shouldShoot && !shooting.isUp)
				{
					shooting.shouldShoot = false;
					shooting.isMoving  = true;

					//play the animation
					shootingAnimation.reset().play();

					//then, then the animation is finished...
					//pause and prepare to play backwards.
					animation.mixer.addEventListener('finished', function pause(event)
					{
						if(event.action === shootingAnimation)
						{
							animation.mixer.removeEventListener('finished', pause);

							shooting.isMoving = false;
							shooting.isUp = true;

							//set up the animation
							shootingAnimation.reset().play().setEffectiveTimeScale(-1);
							shootingAnimation.paused = true;
						}
					});
				}

				if(shooting.shouldStop && shooting.isUp)
				{
					shooting.shouldStop = false;
					shooting.isMoving = true;

					shootingAnimation.paused = false;

					//his arm flaps around too

					//and set things back to normal once the animation is done playing backwards.
					animation.mixer.addEventListener('finished', function stopAnimation(event)
					{
						if(event.action === shootingAnimation)
						{
							animation.mixer.removeEventListener('finished', stopAnimation);

							shooting.isMoving = false;
							shooting.isUp = false;

							shootingAnimation.setEffectiveTimeScale(1);
						}								
					});
				}
			}
		}
	}
});