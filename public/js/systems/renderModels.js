define(['../lib/three.js'], function(THREE)
{
	var baseMeshes = {};

	//scene
	var scene = new THREE.Scene();

	//camera
	var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
	camera.up = new THREE.Vector3(0, 0, 1);
	scene.add(camera);

	//renderer
	var renderer = new THREE.WebGLRenderer({
		antialias: true
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	//renderer.gammaOutput = true;

	//lighting
	var ambientLight = new THREE.AmbientLight(0x556666, 2.5);
	scene.add(ambientLight);

	var pointLight = new THREE.PointLight(0x556666, 0.2);
	scene.add(pointLight);


	entities.emitter.on('modelRemove', entity =>
	{
		let model = entities.getComponent(entity, "model");
		scene.remove(model);
	});

	entities.emitter.on('modelCreate', entity =>
	{
		let modelName = entities.getComponent(entity, "modelName") || "player";

		//could have put the camera in the baseMeshes object, but you don't want a clone.
		if(modelName === "camera")//special behavior for camera
			entities.entities[entity].model = camera;

		else if(baseMeshes[modelName] !== undefined)
			entities.entities[entity].model = baseMeshes[modelName].clone();

		else
			throw new Error("No such appearance available, " + modelName);

		scene.add(entities.getComponent(entity, "model"));
	})


	return {
		load: new Promise((resolve, reject) =>
		{
			server.once('meshLocations', meshLocations =>
			{
				let meshLoadingPromises = [];
				var JSONLoader = new THREE.JSONLoader();
				var ObjectLoader = new THREE.ObjectLoader();//not to be confused with OBJLoader

				meshLocations.forEach(meshLocation =>
				{
					let path = meshLocation + '.json';
					let name = meshLocation.split('/')[3];
					let folder = meshLocation.split('/')[2];

					//files in the models folder, where just one thing was exported.
					if(folder === "models")
						meshLoadingPromises.push(new Promise((resolve, reject) =>
							JSONLoader.load(
								path,
								(geometry, materials) =>
								{
									//load an animated mesh
									if(geometry.skinWeights.length > 0)
									{
										//configure the material for animation
										materials.forEach(material => material.skinning = true);
										//put it all together and assign it
										baseMeshes[name] = new THREE.SkinnedMesh(geometry, materials);
									}

									//load a static mesh
									else
										baseMeshes[name] = new THREE.Mesh(geometry, materials);

									//return
									resolve();
								}
							))
						);

					//things with more than one model in the file.
					else if(folder === "scenes")
						meshLoadingPromises.push(new Promise((resolve, reject) =>
							ObjectLoader.load(
								path,
								(object) =>
								{
									baseMeshes[name] = object;
									resolve();
								}
							))
						);
				});

				Promise.all(meshLoadingPromises).then(resolve);
			});
		}),
		update: (allEntities, elapsedTime) =>
		{
			//and finally, render.
			renderer.render(scene, camera);
		}
	}
});