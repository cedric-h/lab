requirejs(['js/websocketsWrapperClient.js', '/js/lib/ecs/index.js', "/js/lib/three.js"], function(newServer, ecslib, THREE)
{
	//globals
	window.ecs = new ecslib.EntityComponentSystem();
	window.entities = new ecslib.EntityPool();
	window.server = newServer;


	//if we're already connected to the server, START THE LOADING
	if(server.readyState === 1)
		getECSfiles();

	//if not, start it when we are.
	else
		server.addEventListener('open', getECSfiles);

	//this code doesn't look great, but it gets the ECS modules ready to send to ./loadECS.js alright
	//if things aren't working well in other browsers this *may* be why
	function getECSfiles()
	{
		server.emit('loadingECS');
		server.once('ecsFiles', (directories) => //names of the files in the folders to load
		{
			//put all of the modules to load in one array
			let ECSfileNames = [].concat.apply([], Object.values(directories));
			
			//load loadECS and all of the modules
			require(['js/loadECS.js'].concat(ECSfileNames), function()
			{
				//arguments is a numerically indexed object!?! fix that
				arguments = Object.values(arguments);
				//loadECS is the first argument
				let loadECS = arguments.splice(0, 1)[0];

				//for each directory name
				Object.keys(directories).forEach(directoryName =>
				{
					//get the names of the files in that directory
					fileNames = directories[directoryName];

					//ovewrite the filenames with the loaded files
					//by grabbing the relevant section from the front of the array
					directories[directoryName] = arguments.splice(0, fileNames.length);

					//then once they've loaded, dynamically get the name
					directories[directoryName].forEach((fileObject, index) =>
					{
						if(typeof fileObject !== "object")
							throw new Error(directoryName + " file " + fileNames[index] + " did not return an object");

						//get the filename from the filepath
						fileObject.name = fileNames[index].match(/[\w-]+\./)[0];
						fileObject.name = fileObject.name.substring(0, fileObject.name.length - 1);
					})
				});

				//now that we've grabbed what's inside those modules, load 'em up!
				loadECS(
					directories.systems,
					directories.components
				).then(afterECSLoad);

				server.emit('loading');
			});
		});
	}

	//now let's get STARTED
	function afterECSLoad()
	{
		//management of the local player entity
		//this should be done with an assemblage so that you don't have to
		//go back to this script just to add a component to the player
		let localPlayer = entities.create();
		//appearance
	    entities.addComponent(localPlayer, "model");
	    entities.addComponent(localPlayer, "animation");
	    //movement
	    entities.addComponent(localPlayer, "movement");
	    entities.addComponent(localPlayer, "velocity");
	    entities.addComponent(localPlayer, "hitbox");
	    entities.addComponent(localPlayer, "cameraControls");
	    entities.addComponent(localPlayer, "movementControls");
	    entities.addComponent(localPlayer, "velocityParameters");
	    entities.addComponent(localPlayer, "weapon");
	    //mechanics
	    entities.addComponent(localPlayer, "health");

	    entities.getComponent(localPlayer, "weapon").name = "bow";
	    entities.emitter.emit('weaponEquip', localPlayer);


	    //map
	    let map = entities.create();
	    //configuring the components that were just added
	    //set model name
	    entities.addComponent(map, "modelName");
	    entities.setComponent(map, "modelName", 'testRoom');
	    //create things that use modelName
	    entities.addComponent(map, "model");
	    entities.addComponent(map, "collidable");


	    //phew, done loading :D
	    server.emit('loaded');

	    entities.emitter.emit('loaded');


		//update loop
		let clock = new THREE.Clock();

		var update = () =>
		{
			let delta = clock.getDelta();

			ecs.run(entities, delta);

			requestAnimationFrame(update);
		};
		update();
	}
});