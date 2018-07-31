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
			return {
				name: 			undefined,
				model: 			undefined,
				animation: 		undefined,
				shouldShoot: 	false,
				shouldStop: 	false,
				isUp: 			false,
				isMoving: 		false,
				adjustments: 	{},
				targetPosition: new THREE.Vector3()
			}
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