(function()
{
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
				active: 			false,
				directionOverride:  false,
				//speed stuff
				maxSpeed:			15,		//in three.js units a second
				secondsToMax:		0.75,	//how many seconds it takes to max speed from full stop
				currentSpeed: 		0,
				rotationSpeed:		0.115,	//%, multiplied into the time it takes to do a turn
				//rotation variables
				direction: 			new THREE.Quaternion(),
				euler: 				new THREE.Euler(),
				//direction animation variables
				startDirection: 	new THREE.Quaternion(),
				goalDirection:		new THREE.Quaternion(),
				//rotation animation variables
				rotationAnimProg:	0,
				rotationAnimTime:	0
			}
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