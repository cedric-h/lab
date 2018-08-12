const THREE = require('three');

module.exports = {
	load: new Promise((resolve, reject) =>
	{
		resolve();
	}),
	factory: () =>
	{
		return {
			speed: 4,
			movementBlocked: false
		}
	}
};