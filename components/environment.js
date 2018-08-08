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
		};
	},
};