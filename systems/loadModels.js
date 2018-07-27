//ECSbus
var ECSbus   = require('../ECSbus');
let ecs      = ECSbus.ecs;
let entities = ECSbus.entities;

//three.js
const THREE = require('three');

//file system
const fs = require('fs-extra');


var scene = new THREE.Scene();
var baseModels = {};


entities.emitter.on('modelRequest', entity =>
{
    //retrieve the model based on name
    let modelName = entities.getComponent(entity, "model");
    entities.entities[entity].model = baseModels[modelName].clone();

    //add model to scene
    let model = entities.getComponent(entity, "model");
    scene.add(model);
});

entities.emitter.on('addToScene', entity =>
{
    //add model to scene
    let model = entities.getComponent(entity, "model");
    scene.add(model);
});


//ECS exports
module.exports = {
    load: new Promise((resolve, reject) =>
    {
        fs.readdirSync('./public/assets/models/').forEach(meshLocation =>
        {
            if(meshLocation.split('.')[1] === 'json')
            {
                let path = './public/assets/models/' + meshLocation;
                let name = path.split('/')[4].split('.')[0];
                let folder = path.split('/')[3];

                if(folder === "models")
                    baseModels[name] = new THREE.Mesh(JSON.parse(fs.readFileSync(path)));
            }
        });

        resolve();
    }),
    update: (entity, delta) => {}
};