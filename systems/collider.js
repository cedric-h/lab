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


//variable declaration
let delta = new THREE.Vector3();


//ECS exports
module.exports = {
    componentTypesAffected: ['collider'],
    searchName: 'collider',
    load: new Promise((resolve, reject) =>
    {
        resolve();
    }),
    update: (entity, timeDelta) => 
    {
        let collider = entities.getComponent(entity, "collider");
        let model    = entities.getComponent(entity, "model");

        entities.find("collider").forEach(otherEntity =>
        {
            if(entity !== otherEntity)
            {
                let otherCollider = entities.getComponent(otherEntity, "collider");
                let otherModel    = entities.getComponent(otherEntity, "model");

                delta.copy(model.position).sub(otherModel.position);

                if(delta.length() <= collider.radius)
                {
                    delta.divideScalar(2);
                    model     .position.add(delta);
                    otherModel.position.sub(delta);
                }
            }
        });
    }
};