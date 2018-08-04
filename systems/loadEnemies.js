//ECSbus
var ECSbus   = require('../ECSbus');
let ecs      = ECSbus.ecs;
let entities = ECSbus.entities;

//file system
const fs = require('fs-extra');

//broadcast
const broadcast = require('../broadcast.js');


//helper functions
const getEnemyData = (entity) =>
{
    let model    = entities.getComponent(entity, 'model');
    let weapon   = entities.getComponent(entity, 'weapon');
	let combat 	 = entities.getComponent(entity, 'combat');

	return {
        //default components and override values (for primitives)
		components: [
			'modelName',
			'health',
			'targetable',
            'weapon',
            'animation'
		],
		componentOverrides: {
			modelName: 'angryBoi',
			serverId: entity
		},
        //orientation and model customization
		position: 	model.position	.toArray(),
		quaternion: model.quaternion.toArray(),
		scale: 		model.scale 	.toArray(),
        //weaponry
        weaponName: weapon.name
	}
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
		client.send('enemiesToInstantiate', entities.find('enemy').map(getEnemyData))
    );
});


//ECS exports
module.exports = {
    componentTypesAffected: ['model', 'attackable', 'ai'],
    searchName: "enemy",
    load: new Promise((resolve, reject) =>
    {
        fs.readFile('./gamedata/enemies.json', "utf8").then((rawData) =>
        {
        	let data = JSON.parse(rawData);

        	//spawn enemies
        	Object.keys(data).forEach(enemyName =>
        	{
        		enemyType = data[enemyName];

        		enemyType.spawns.forEach(enemy =>
        		{
        			let enemyEntity = entities.create();
        			entities.addComponent(enemyEntity, "ai");
        			entities.addComponent(enemyEntity, "combat");
                    entities.addComponent(enemyEntity, "health");
        			entities.addComponent(enemyEntity, "weapon");
        			entities.addComponent(enemyEntity, "attackable");
                    //model
                    entities.addComponent(enemyEntity, "modelName");
                    entities.setComponent(enemyEntity, "modelName", enemyName);
                    entities.addComponent(enemyEntity, "model");

        			let model = entities.getComponent(enemyEntity, "model");
        			//after model loads
        			model.position.fromArray(enemy.position);
        			model.scale.multiplyScalar(
        				getRandom(enemy.scaleVariance || enemyType.scaleVariance)
        			);

                    //weapon
                    let weapon  = entities.getComponent(enemyEntity, "weapon");
                    weapon.name = enemy.weapon || enemyType.weapon;
                    entities.emitter.emit('weaponEquip', enemyEntity);

                    //health
        			let health = entities.getComponent(enemyEntity, 'health');
        			health.val = enemy.health || enemyType.health;
        			health.max = health.val;
        		});
        	});

        	resolve();
        });
    }),
    update: (entity, delta) => {}
};