(function()
{
	//requires
	var THREE;

	//ECS output
	var exportObject = {
		serverAndClient: true,
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}),
		factory: () =>
		{
			//velocity itself is just a vector3, these exist for doing some extra stuff with velocity.
			//I guess velocityConfig would've been a better name?
			return {
				dependents: [],
				frictionOn: false,
				friction:   undefined,
				gravityOn: 	true,
			};
		}
	}


	//exporting
	if(typeof window === "undefined")
	{
		THREE = require('three');

		module.exports = exportObject;
	}

	else
		define(['../lib/three.js'], threefile =>
		{
			THREE = threefile;

			return exportObject;
		});
})();