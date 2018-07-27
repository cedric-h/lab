const THREE = require('three');

module.exports = {
	load: new Promise((resolve, reject) =>
	{
		resolve();
	}),
	factory: function createPosition()
	{
		return {
			target: 		undefined,
			active: 		false,
			armDownTimeout: undefined,
			armDownWait: 	1000,
			projectileCount: 0
		}
	}
};