(function()
{
	//dependencies
	var THREE;
	var entities;
	var ecs;

	//constants
	const friction = 0.98;//percentage remaining after one second.

	//ECS output
	var exportObject = {
		serverAndClient: true,
		componentTypesAffected: ["model", "velocity"],
		searchName: 'affectedByVelocity',
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}),
		update: (entity, delta) =>
		{
			let velocity			= entities.getComponent(entity, 'velocity');
			let model 				= entities.getComponent(entity, 'model');
			let velocityParameters	= entities.getComponent(entity, 'velocityParameters');
			let movement			= entities.getComponent(entity, 'movement');

			if(typeof model !== 'string')
			{
				let thingsToMove = (velocityParameters !== undefined) ? velocityParameters.dependents.slice() : [];
				thingsToMove = thingsToMove.map(entityId => entities.getComponent(entityId, 'model'));
				thingsToMove.push(model);


				//handle optional velocity stuff
				if(velocityParameters)
				{
					if(velocityParameters.frictionOn)
					{
						let frictionThisFrame = Math.pow(1.0 - friction, delta);

						//apply friction to the velocity
						velocity.multiplyScalar(frictionThisFrame);
						//round off the friction if it's pretty close to zero
						if(velocity.length() < 0.05)
							velocity.set(0, 0, 0);

						//apply friction to the movement speed too,
						//if we're dealing with the player here
						if(movement)
						{
							movement.currentSpeed *= frictionThisFrame;
							//round that off too, if it's close enough to zero
							if(movement.currentSpeed < 0.05)
								movement.currentSpeed = 0;
						}
					}
				}


				//get how much it's moving this frame
				let deltaVelocity = velocity.clone();

				if(velocityParameters && velocityParameters.gravityOn)
					deltaVelocity.z += -1;

				deltaVelocity.multiplyScalar(delta);


				//apply that to each thingToMove
				thingsToMove.forEach(thingToMove =>
				{
					thingToMove.position.add(deltaVelocity);
				});
			}
		}
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