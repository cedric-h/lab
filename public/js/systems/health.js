define(['../lib/three.js'], function(THREE)
{
	//variable declaration
	var ringGeometry;
	var ringMaterial;
	var ringRotationSpeed = (Math.PI*2)/100;


	//helper functions
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

	function addHealthRing(entity)
	{
		let health = entities.getComponent(entity, "health");

		//configuring the model and adding it to its parent model.
		let model = new THREE.Mesh(ringGeometry, ringMaterial.clone());
		model.name = "healthRing";
		model.position.z += 0.06;

		if(entities.getComponent(entity, "targetable"))
		{
			health.shouldRingRotate = false;
			model.material.color.setRGB(1, 1, 0);
		}

		entities.getComponent(entity, "model").add(model);

		//preparing the depletion animation
		health.mixer = new THREE.AnimationMixer(model);
		health.deplete = health.mixer.clipAction(
			THREE.AnimationClip.findByName(model.geometry.animations, "animation_")
		);
		health.deplete.loop = THREE.LoopOnce;
		health.deplete.clampWhenFinished = true;
		health.deplete.play();
		health.deplete.setEffectiveTimeScale(10);
	}


	//make the rings of entities that aren't targeted anymore go back to yellow
	entities.emitter.on("targetedRemove", entity =>
	{
	    let model  = entities.getComponent(entity, 'model');

	    if(model)
	    	model.getObjectByName('healthRing').material.color.setRGB(1, 1, 0);
	});

	//make the rings of entities that are targeted turn red.
	entities.emitter.on('targetedCreate', entity =>
	{
	    let model  = entities.getComponent(entity, 'model');
	    let healthRing = model.getObjectByName('healthRing');
	    if(healthRing)
	    	healthRing.material.color.setRGB(1, 0, 0);
	});


	//when you first join, the server sends you a packet with all health data.
	server.once('allHealthData', data =>
	{
		entities.find("serverId").forEach(entity =>
		{
			let health 	 = entities.getComponent(entity, "health");
			let serverId = entities.getComponent(entity, "serverId");
			
			if(health && data[serverId])
			{
				entities.entities[entity].health = data[serverId];

				let model  = entities.getComponent(entity, "model");
				let health = entities.getComponent(entity, "health");

				if(!model.getObjectByName("healthRing"))
					addHealthRing(entity);
			}
		});
	});

	//this one is for regular health updates that don't have data on all entities
	//or data about max health; just the current value for one entity.
	server.on('healthUpdate', data =>
	{
		let entity = entityWithId(data.serverId);

		if(entity !== undefined)
		{
			let health = entities.getComponent(entity, "health");

			if(health.val === undefined)
				addHealthRing(entity);
			
			health.val = data.val;
		}
	});


	//ECS output
	return {
		componentTypesAffected: ['health'],
		searchName: 'health',
		load: new Promise((resolve, reject) =>
		{
			var JSONLoader = new THREE.JSONLoader();

			JSONLoader.load(
				'../../assets/ui/healthRing.json',
				geometry =>
				{
					ringGeometry = geometry;
					ringMaterial = new THREE.MeshBasicMaterial({
						color: 		  0x00ff00,
						opacity: 	  0.41,
					    transparent:  true,
					    morphTargets: true
					});

					resolve();
				}
			)
		}), 
		update: (entity, delta) =>
		{
			let health = entities.getComponent(entity, "health");

			if(health.mixer !== undefined)
			{
				let model = entities.getComponent(entity, "model");
				let ring = model.getObjectByName('healthRing');

				let deplete  = health.deplete;
				let duration = deplete.getClip().duration;
				let animationProgress = (duration - deplete.time)/duration;
				let healthPercentage  = health.val/health.max;

				ring.rotation.z += ringRotationSpeed*(1 - Math.max(healthPercentage, 0));

				//only play the animation if the two ratios are disproportionate
				//for some reason the last 0.14 is of the bar going back to full,
				//so go ahead and kill the thing at that point since they're out of health.
				if(healthPercentage <= 0)
					entities.destroy(entity);

				else 
				{
					if(healthPercentage < animationProgress && (duration - deplete.time) > 0.14)
						health.mixer.update(delta);

					//if health percentage 10% or more behind animationProgress,
					//restart the animation.
					if(animationProgress - healthPercentage < -0.1)
						deplete.reset().play();
				}
			}
		}
	}
});