const THREE = require('three');
const EventEmitter = require('events');

module.exports = {
	load: new Promise((resolve, reject) =>
	{
		resolve();
	}),
	factory: () =>
	{
		return {
			target: 		 undefined,
			projectileCount: 0,
			readied: 		 false,
			readying: 		 false,
			attackOn: 		 false,
			withinRange: 	 false,
			lastAttackDate:  undefined,
			readiedPosition: new THREE.Vector3(),
			emitter: 		 new EventEmitter()
		}
	},
	reset: combat =>
	{
		combat.target	 = undefined;
		combat.attackOn  = false;

		combat.emitter.removeAllListeners();
	}
};