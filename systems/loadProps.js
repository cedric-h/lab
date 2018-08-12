//ECSbus
var ECSbus   = require('../ECSbus');
let ecs      = ECSbus.ecs;
let entities = ECSbus.entities;

//file system
const fs = require('fs-extra');

//broadcast
const broadcast = require('../broadcast.js');


//helper functions
const getPropData = (entity) =>
{
    let model = entities.getComponent(entity, 'model');
    let prop  = entities.getComponent(entity, 'prop');

	let propData = {
        //default components and override values (for primitives)
		components: [
			'modelName',
            'textbox'
		],
		componentOverrides: {
			modelName: entities.getComponent(entity, 'modelName'),
			serverId: entity,
            textbox: prop
		},
        //orientation customization
		position: 	model.position	.toArray(),
		quaternion: model.quaternion.toArray(),
		scale: 		model.scale 	.toArray(),
	}

    if(entities.getComponent(entity, 'interactable'))
    {
        propData.components.push('animation');
    }

    return propData;
};

const getRandom = bounds =>
{
	let big   = bounds[0];
	let small = bounds[1];

	return small + Math.random() * (big - small);
}


entities.emitter.on("clientCreate", entity =>
{
	let client = entities.getComponent(entity, "client");

	client.once('loaded', () =>
		client.send('propsToInstantiate', entities.find('prop').map(getPropData))
    );
});


//ECS exports
module.exports = {
    componentTypesAffected: ['prop'],
    searchName: "prop",
    load: new Promise((resolve, reject) =>
    {
        fs.readFile('./gamedata/props.json', "utf8").then((rawData) =>
        {
        	let data = JSON.parse(rawData);

        	//spawn props
        	Object.keys(data).forEach(propName =>
        	{
        		propType = data[propName];

        		propType.spawns.forEach(prop =>
        		{
        			let propEntity = entities.create();
                    //model
                    entities.addComponent(propEntity, "modelName");
                    entities.setComponent(propEntity, "modelName", propName);
                    entities.addComponent(propEntity, "model");
                    //prop
                    entities.addComponent(propEntity, 'prop');

                    //configure model
        			let model = entities.getComponent(propEntity, "model");
        			model.position.fromArray(prop.position);

                    //configure prop
                    let propComponent = entities.getComponent(propEntity, 'prop');
                    let text = prop.text || propType.text;
                    Object.assign(propComponent, text);
                    
                    //add/configure interactability
                    let interactabilityData = prop.interactable || propType.interactable;
                    if(interactabilityData)
                    {
                        entities.addComponent(propEntity, "interactable");
                        let interactableComponent = entities.getComponent(propEntity, "interactable");
                        Object.assign(interactableComponent, interactabilityData);
                    }
        		});
        	});

        	resolve();
        });
    }),
    update: (entity, delta) => {}
};