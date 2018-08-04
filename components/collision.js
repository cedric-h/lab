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
			lastPos: undefined,
			emitter: new EventEmitter(),
			target:  undefined
		};
	},
	reset: collision =>
	{
		collision.emitter.removeAllListeners('hit');
		collision.lastPos = undefined;
		collision.target  = undefined;
	}
};