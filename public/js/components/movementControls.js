(function()
{
	var THREE;

	var exportObject = {
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}),
		factory: () =>
		{
			return {
				enabled: 			true,
				//data for handling getting things to the server
				serverData: 		{},		//where the server thinks we are
				updateServerEvery:  1/5, 	//number after the one is the FPS
				//direction
				keysDirection: 		new THREE.Quaternion(),
				velocityOverride: 	new THREE.Vector3(),
				overrideActive: 	false,
				//keymap
				keyMap: {
					'w': {
						isPressed: 	false,
						direction: 	new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI))
					},
					's': {
						isPressed: 	false,
						direction: 	new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0))
					},
					'a': {
						isPressed: 	false,
						direction: 	new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI/2))
					},
					'd': {
						isPressed: 	false,
						direction: 	new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI/2))
					}
				}
				//there's no harm in having verbose JSON files, so while the repeated new THREE.Quaternion
				//would bother me in code, here it doesn't really get me.
				//Regardless, here's a script I wrote in case you need to convert a bunch of directions
				//like these into Quaternions. A more efficient way to store them would be:
				//new THREE.Quaternion(x, y, z, w) because then no conversion has to happen, but I
				//didn't bother since only four of them can't really increase loadtimes on their own...
				/* // Here I used setFromAxisAngle, but setFromEuler as above would work just as well.
				Object.values(keyMap).map(key =>
				{
					key.direction = new THREE.Quaternion().setFromAxisAngle(
						new THREE.Vector3(0, 0, 1),
						key.direction
					);
					key.isPressed = false;
					console.log(key.toArray());//so you can get the x, y, z, w for storage
					return key;
				});*/
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