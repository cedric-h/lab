(function()
{
	var THREE;

	var exportObject = function(location, destinationEntities)
	{
		let destinations = destinationEntities
		.map(entity =>
    	{
			let model = entities.getComponent(entity, "model");

			if(model)
				return {
					distance: location.distanceTo(model.position),
					entity:   entity
				};
    	})
		.filter(destination => destination !== undefined);

    	if(destinations.length > 0)
    		return destinations.reduce((accumulator, currentValue) =>
	    	{
	    		if(accumulator === undefined || currentValue.distance < accumulator.distance)
	    			return currentValue;
	    		
	    		else
	    			return accumulator;
	    	}).entity;
	}

	//exporting
	if(typeof window === "undefined")
	{
		THREE = require('three');
		//ECSbus
		var ECSbus 	= require('../../../ECSbus');
		ecs 	 	= ECSbus.ecs;
		entities 	= ECSbus.entities;

		module.exports = exportObject;
	}

	else
		define(['../lib/three.js'], threefile =>
		{
			THREE = threefile;

			//ECS
			entities = window.entities;
			ecs 	 = window.ecs;

			return exportObject;
		});
})();