//three.js
const THREE = require('three');

//events
const EventEmitter = require('events');


//ECS export
module.exports = {
	load: new Promise((resolve, reject) =>
	{
		resolve();
	}),
	factory: () =>
	{
		return {
			lastPos: 	undefined,
			target:  	undefined,
			emitter: 	new EventEmitter(),
			offset: 	new THREE.Vector3(0, 0, 0)
		};
	},
	reset: collision =>
	{
		collision.emitter.removeAllListeners('hit');
		collision.lastPos   = undefined;
		collision.target    = undefined;
		collision.offset.set(0, 0, 0);
	}
};