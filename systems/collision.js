//ECSbus
var ECSbus   = require('../ECSbus');
let ecs      = ECSbus.ecs;
let entities = ECSbus.entities;

//tiny helper scripts
const broadcast = require('../broadcast.js');

//three.js
const THREE = require('three');

//file system
const fs = require('fs-extra');


//variable declaration
var raycaster = new THREE.Raycaster();
var direction = new THREE.Vector3();
var results   = [];
var map;


//ECS exports
module.exports = {
    componentTypesAffected: ["collision"],
    searchName:              "collision" ,
    load: new Promise((resolve, reject) =>
    {
        let loader = new THREE.ObjectLoader();

        fs.readFile('./public/assets/collisionMaps/testRoom.json', 'utf8').then(data =>
        {
            map = loader.parse(JSON.parse(data));
            map.updateMatrixWorld(true);

            let mapEntity = entities.create();
            entities.addComponent(mapEntity, "model");
            entities.entities[mapEntity].model = map;
            entities.addComponent(mapEntity, "environment");

            resolve();
        });
    }),
    update: (entity, delta) => 
    {
        let collision = entities.getComponent(entity, "collision");
        let model     = entities.getComponent(entity, "model");

        if(collision.lastPos === undefined)
            collision.lastPos = model.position.clone();

        else
        {
            raycaster.set(
                model.position,
                direction.subVectors(model.position, collision.lastPos).normalize()
            );
            raycaster.far = model.position.distanceTo(collision.lastPos) + 0.5;

            if(collision.target !== "map")
            {
                let targetModels = entities.find(collision.targetType).map(entity =>
                {
                    let model = entities.getComponent(entity, 'model');

                    if(model)
                    {
                        model.updateMatrixWorld();
                        return model;
                    }
                }).filter(element =>
                    element !== undefined
                );

                raycaster.intersectObjects(
                    targetModels,
                    false,
                    results
                );
            }

            if(results.length > 0)
                collision.emitter.emit('hit', 'target', results[0].object.name);

            else
            {
                raycaster.intersectObject(
                    map,
                    true,
                    results
                );

                if(results.length > 0)
                    collision.emitter.emit('hit', 'map');

                else
                    collision.lastPos.copy(model.position);
            }

            results = [];
        }
    }
}