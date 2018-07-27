(function()
{
	//requires
	var THREE;


	var exportObject = {
		serverAndClient: true,
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}),
		factory: () =>
		{
			return new THREE.Vector3();
		}
	}

	if(typeof window === "undefined")
	{
		THREE = require('three');

		module.exports = exportObject;
	}

	else
		define(['../lib/three.js'], (threefile) =>
		{
			THREE = threefile;
			return exportObject;
		});
})();