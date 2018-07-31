define(['../lib/three.js'], function(THREE)
{
	//variable declaration
	var weaponModels = {};


	//assign that listener
	entities.emitter.on('weaponEquip', entity =>
	{
		let weapon 	= entities.getComponent(entity, "weapon");
		let model 	= entities.getComponent(entity, "model");

		//grab the model
    	weapon.model = weaponModels[weapon.name].clone();
    	model.parent.add(weapon.model);

    	weapon.model.up.set(0, 0, 1);
	});

	entities.emitter.on('weaponRemove', entity =>
	{
		let weapon = entities.getComponent(entity, "weapon");

		weapon.model.parent.remove(weapon.model);
	});
	

	//ECS output
	return {
		componentTypesAffected: ['shooting', 'model'],
		load: new Promise((resolve, reject) =>
		{
			server.once('meshLocations', meshLocations =>
			{
				var JSONLoader = new THREE.JSONLoader();
				var modelLoadingPromises = [];

				meshLocations.forEach(meshLocation =>
				{
					let path = meshLocation + '.json';
					let name = meshLocation.split('/')[3];
					let folder = meshLocation.split('/')[2];

					if(folder === "weapons")
						modelLoadingPromises.push(new Promise((resolve, reject) =>
							JSONLoader.load(
								path,
								(geometry, materials) =>
								{
									weaponModels[name] = new THREE.Mesh(geometry, materials);

									resolve();
								}
							)
						));
				});

				Promise.all(modelLoadingPromises).then(resolve);
			});
		}),
		update: (entity, delta) =>
		{
		}
	}
});