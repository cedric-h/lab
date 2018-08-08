(function()//to create a private scope so nothing leaks to global
{
	//vars that keep track of loading
	//components and systems are asynchronously loaded incase you need to i.e. load some images
	var systemsLoaded = false;
	var componentsLoaded = false;

	//parameters are objects
	function loadECS(systemsFiles, componentFiles)
	{
		return Promise.all([
			//systems
			new Promise((resolve, reject) =>
			{
				let systemLoadPromises = [];

				//prepare the systems for loading
				systemsFiles.forEach(systemModule =>
				{
					if(systemModule.componentTypesAffected)
					{

						//register the ECS search for componentTypesAffected
						searchName = systemModule.searchName || systemModule.componentTypesAffected[0];
						
						//try catch because it complains if the search is already registered :D
						try
						{
							entities.registerSearch(searchName, systemModule.componentTypesAffected);
						}

						catch(error)
						{

						};

						//you can now use that search keyword (i.e. with entities.find())
						//to get all entities that have all of the componentTypesAffected.
						//we register the keywords before we load the systems because...
						//well, what if you want to use them while loading the systems?
						//should probably load the components *then* load the systems then,
						//so you have something to search for :thinking:
						//eh I'll do it when I need it
					}

					systemLoadPromises.push(systemModule.load);
				});

				//load those guys
				Promise.all(systemLoadPromises).then(() =>
				{
					//now that all of the systems are loaded, let's add them to the ECS
					systemsFiles.forEach(system =>
					{
						if(system.update)
						{
							if(system.componentTypesAffected)
							{
								if(system.searchName === undefined && system.componentTypesAffected.length > 0)
									throw new Error(system.name + ": searchName is required when more than one componentTypesAffected are present.");
								
								let searchName = system.searchName || system.componentTypesAffected[0];
								ecs.addEach(system.update, searchName);
							}

							//if they didn't specify components that an entity has to have,
							//just add their script to the system so it's called once per update.
							else
								ecs.add(system.update);
						}
					});

					resolve();
				});
			}),
			//components
			new Promise((resolve, reject) =>
			{
				let componentLoadingPromises = [];

				//prepare them for loading
				componentFiles.forEach(componentFile =>
				{
					componentLoadingPromises.push(componentFile.load);
				});

				//load them all
				Promise.all(componentLoadingPromises).then(() =>
				{
					componentFiles.forEach((component) =>
					{
						entities.registerComponent(
							component.name,
							component.factory,
							component.reset,
							component.maxCount
						);
					});

					resolve();
				});
			})
		]);
	}

	if(typeof window === "undefined")//we're in Node
	{
		//ECSbus shares these ECS variables with all of the code base.
		var ECSbus   = require('../../ECSbus');
		var ecs      = ECSbus.ecs;
		var entities = ECSbus.entities;

		module.exports = loadECS;
	}

	else //we're in a browser
	{
		var ecs = window.ecs;
		var entities = window.entities;

		define([], () => loadECS);
	}
})();