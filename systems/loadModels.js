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


entities.emitter.on('modelCreate', entity =>
{
    //retrieve the model based on name
    let modelName = entities.getComponent(entity, "modelName");

    if(modelName)
    {
        entities.entities[entity].model = baseModels[modelName].clone();

        //add model to scene
        let model = entities.getComponent(entity, "model");
        scene.add(model);
    }
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
                {
                    //load the actual geometry
                    let geometry = JSON.parse(fs.readFileSync(path));
                    let box = new THREE.Box3().setFromArray(geometry.vertices);
                    let size = new THREE.Vector3();
                    box.getSize(size);

                    //get a box from it and make that the mesh
                    baseModels[name] = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z));

                    //orient the models so that the center is at their feet.
                    //this makes it easier to deal with the players but not the
                    //arrows and things at all, those should go into another file
                    //and get loaded without having this translation applied,
                    //but the arrow models aren't used on the server yet and
                    //and the client loads the actual models instead of making
                    //boxes of them so reorienting the models like this isn't necessary.
                    baseModels[name].geometry.translate(0, 0, size.z/2);
                }
            }
        });

        resolve();
    }),
    update: (entity, delta) => {}
};