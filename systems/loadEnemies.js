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
	let model 	 = entities.getComponent(entity, 'model');

	return {
		components: [
			'modelName',
			"health",
			'targetable'
		],
		componentOverrides: {
			modelName: 'angryBoi',
			serverId: entity
		},
		position: 	model.position	.toArray(),
		quaternion: model.quaternion.toArray(),
		scale: 		model.scale 	.toArray()
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
	{
		client.send('enemiesToInstantiate', entities.find('enemy').map(getEnemyData));
	});
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
        			entities.addComponent(enemyEntity, "model");
        			entities.addComponent(enemyEntity, "health");
        			entities.addComponent(enemyEntity, "attackable");

        			entities.entities[enemyEntity].model = enemyName;
        			entities.emitter.emit('modelRequest', enemyEntity);
        			let model = entities.getComponent(enemyEntity, "model");
        			//after model loads
        			model.position.fromArray(enemy.position);
        			model.scale.multiplyScalar(
        				getRandom(enemy.scaleVariance || enemyType.scaleVariance)
        			);

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