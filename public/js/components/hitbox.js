(function()
{
	//requires
	var THREE;
	var events;


	var exportObject = {
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}),
		factory: () =>
		{
			return {
				//rays
				rays: 			[],
				rayDirections: 	[],
				rayDensity: 	new THREE.Vector3(0.5, 0.5, 1),
				rayLengths: 	new THREE.Vector3(1, 1, 1.15),
				scale: 			new THREE.Vector3(1, 1, 2),
				//center
				centerObject: 	undefined,
				centerPosition: new THREE.Vector3(),
				//state
				emitter: 		new events(),
				isColliding: 	false
			}
		}
	}

	if(typeof window === "undefined")
	{
		THREE = require('three');
		EventEmitter = require('events');

		module.exports = exportObject;
	}

	else
		define(['../lib/three.js', '../lib/EventEmitter.js'], (threefile, eventsFile) =>
		{
			THREE = threefile;
			events = eventsFile;

			return exportObject;
		});
})();