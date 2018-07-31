define(['../lib/three.js'], function(THREE)
{
	var collisionMaps = {};

	entities.emitter.on('collidableCreate', entity =>
	{
		let modelName = entities.getComponent(entity, "modelName");

		entities.entities[entity].collidable = collisionMaps[modelName].clone();
	});

	//ECS output
	return { 
		load: new Promise((resolve, reject) =>
		{
			server.once('meshLocations', meshLocations =>
			{
				var ObjectLoader = new THREE.ObjectLoader();
				var mapLoadingPromises = [];

				meshLocations.forEach(meshLocation =>
				{
					let path = meshLocation + '.json';
					let name = meshLocation.split('/')[3];
					let folder = meshLocation.split('/')[2];

					if(folder === "collisionMaps")
						mapLoadingPromises.push(new Promise((resolve, reject) =>
							ObjectLoader.load(
								path,
								scene =>
								{
									scene.updateMatrixWorld(true);
									collisionMaps[name] = scene;
									resolve();
								}
							)
						));
				});

				Promise.all(mapLoadingPromises).then(resolve);
			});
		}), 
		update: (entity, delta) => {}
	}
});