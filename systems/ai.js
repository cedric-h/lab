//ECSbus
var ECSbus   = require('../ECSbus');
let ecs      = ECSbus.ecs;
let entities = ECSbus.entities;

//file system
const fs = require('fs-extra');

//three.js
const THREE = require('three');

//tiny helper scripts
const broadcast = require('../broadcast.js');
const closestEntity = require('../public/js/util/closestEntity.js');


//variable declaration
const delta         = new THREE.Vector3(0, 0, 0);
const raycastOrigin = new THREE.Vector3(0, 0, 0);
const down          = new THREE.Vector3(0, 0, -1);
let results = [];
const raycaster = new THREE.Raycaster();
raycaster.far = 5.5;


//ECS exports
module.exports = {
    componentTypesAffected: ['ai'],
    searchName: "ai",
    load: new Promise((resolve, reject) =>
    {
        resolve();
    }),
    update: (entity, timeDelta) => 
    {
        let model  = entities.getComponent(entity, "model");
        let combat = entities.getComponent(entity, "combat");
        let weapon = entities.getComponent(entity, "weapon");
    	let ai     = entities.getComponent(entity, "ai");


        //find out who we'll be attacking

        if(combat.target === undefined)
        {
            let closestPlayerEntity = closestEntity(
                model.position,
                entities.find('client').filter(
                    entity => entities.getComponent(entity, "model")
                )
            );

            if(closestPlayerEntity !== undefined)
            {
                combat.emitter.emit('toggleAttackOn', {
                    target: closestPlayerEntity
                });
            }
	    }

        if(combat.target !== undefined)
        {
            let targetModel = entities.getComponent(combat.target, "model");

            //look at and move towards them.
            delta.x = targetModel.position.x - model.position.x;
            delta.y = targetModel.position.y - model.position.y;
            //rotation
            model.rotation.z = Math.atan2(delta.y, delta.x);
            //position
            if(!combat.withinRange && weapon.type === "melee" && !ai.movementBlocked)
            {
                let map = entities.getComponent(entities.find('environment')[0], "model");

                delta.normalize();
                delta.multiplyScalar(ai.speed * timeDelta);
                raycastOrigin.addVectors(delta, model.position);
                raycastOrigin.z += 5;

                raycaster.set(
                    raycastOrigin,
                    down
                );
                raycaster.intersectObject(
                    map,
                    true,
                    results
                );

                if(results.length > 0)
                {
                    model.position.copy(results[0].point)

                    results = [];
                }

                else
                    model.position.z -= 4 * timeDelta;
            }
        }
    }
};