//ECSbus
var ECSbus   = require('../ECSbus');
let ecs      = ECSbus.ecs;
let entities = ECSbus.entities;

//file system
const fs = require('fs-extra');

//broadcast
const broadcast = require('../broadcast.js');


//variable declaration
const formationFileNames = [];
var isSpawningEnemies = false;


//helper functions
const getEnemyData = (entity) =>
{
    let model  = entities.getComponent(entity, 'model');
    let weapon = entities.getComponent(entity, 'weapon');
    let combat = entities.getComponent(entity, 'combat');
	let health = entities.getComponent(entity, 'health');

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
            //appearance
			modelName: 'angryBoi',
            //logistics
			serverId: entity,
            //health
            health: {
                val: health.val,
                max: health.max
            }
		},
        //orientation and model customization
		position: 	model.position	.toArray(),
		quaternion: model.quaternion.toArray(),
		scale: 		model.scale 	.toArray(),
        //weaponry
        weaponName: weapon.name,
	}
};

const getRandom = bounds =>
{
	let big   = bounds[0];
	let small = bounds[1];

	return small + Math.random() * (big - small);
}

const spawnThisFormation = formation =>
{
    //spawn enemies
    Object.keys(formation).forEach(enemyName =>
    {
        if(enemyName === "enabled")
            return;

        enemyType = formation[enemyName];

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
            setImmediate(() =>
            {
                if(weapon.type === 'melee')
                    entities.addComponent(enemyEntity, 'collider');
            });

            //health
            let health = entities.getComponent(enemyEntity, 'health');
            health.val = enemy.health || enemyType.health;
            health.max = health.val;

            broadcast('entitySpawn', getEnemyData(enemyEntity));

            isSpawningEnemies = false;
        });
    });
};

const pickFileThenSpawn = () =>
{
    let fileName = formationFileNames[Math.floor(Math.random() * formationFileNames.length)];

    fs.readFile('./gamedata/enemyFormations/' + fileName, "utf8").then(data =>
    {
        let formation = JSON.parse(data);

        if(formation.enabled)
        {
            console.log(fileName.split('.')[0]);
            spawnThisFormation(formation);
        }

        else
        {
            formationFileNames.splice(formationFileNames.indexOf(fileName), 1);
            pickFileThenSpawn();
        }
    });
}


//bring clients up to speed when they log in.
entities.emitter.on("clientCreate", entity =>
{
	let client = entities.getComponent(entity, "client");

	client.once('loaded', () =>
		client.send('enemiesToInstantiate', entities.find('enemy').map(getEnemyData))
    );
});


//spawn enemies on switch pull
entities.emitter.on('interactableCreate', entity =>
{
    let modelName = entities.getComponent(entity, "modelName")

    if(modelName === "lever")
    {
        let interactable = entities.getComponent(entity, "interactable");

        interactable.emitter.on('interact', () =>
        {
            if(entities.find('ai').length === 0 && !isSpawningEnemies)
            {
                isSpawningEnemies = true;

                setTimeout(pickFileThenSpawn, 7500);

                broadcast('interaction', entity);
            }
        });
    }
});


//ECS exports
module.exports = {
    componentTypesAffected: ['ai', 'weapon'],
    searchName: 'enemy',
    load: new Promise((resolve, reject) =>
    {
        fs.readdir('./gamedata/enemyFormations/').then(data =>
        {
            formationFileNames.push(...data);

            resolve();
        });
    }),
    update: (entity, delta) => {}
};