const THREE = require('three');

module.exports = {
	load: new Promise((resolve, reject) =>
	{
		resolve();
	}),
	factory: function createPosition()
	{
		return {
			start: 			new THREE.Vector3(),
			end: 			new THREE.Vector3(),
			speed: 			0,
			time: 			0,
			totalTime:  	0,
		}
	},
	reset: function(flightpath)
	{
		flightpath.time = 0;
		flightpath.totalTime = 0;
	}
};