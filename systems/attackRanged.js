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
var arrowOrigins = undefined;


//helper functions
function rangedAttack(attackerEntity, attackData)
{
    //attacker components
    let attackerModel     = entities.getComponent(attackerEntity, "model");
    let attackerModelName = entities.getComponent(attackerEntity, "modelName");
    let client            = entities.getComponent(attackerEntity, "client");
    let combat            = entities.getComponent(attackerEntity, "combat");
    //target components
    let targetModel = entities.getComponent(combat.target, "model");

    let targetPos = attackData.targetPos;

    //grab the attack data
    let attack = entities.getComponent(attackerEntity, "weapon").attacks[attackData.attackIndex];

    //modify where the arrow will go with some juicy randomness
    if(targetPos === undefined)
    {
        targetPos = targetModel.position.clone();
        let size           = new THREE.Vector3();
        let targetBox      = new THREE.Box3();
        targetBox.setFromObject(targetModel);
        targetBox.getSize(size);
        //apply randomness based on the dimensions of the target model
        targetPos.x += size.x * (0.4 - Math.random()*0.8);
        targetPos.y += size.y * (0.4 - Math.random()*0.8);
        targetPos.z += size.z * (0.2 + Math.random()*0.6);
        //they missed!
        if(Math.random() < 0.25)
        {
            let offset = targetPos.distanceTo(attackerModel.position)/5;
            targetPos.x += offset/2 - Math.random() * offset;
            targetPos.y += offset/2 - Math.random() * offset;
            targetPos.z += offset/4 - Math.random() * offset/2;
        }
    }

    //have the attacker shift their gun to point at the targetPos instead of the model's origin
    broadcast('aimWeaponAt', {
        attackerEntity: attackerEntity,
        targetPos: targetPos.toArray()
    });

    //wait a bit, then fire the arrow
    setTimeout(
        () =>
        {
            if(!combat.readied || entities.find('model').indexOf(attackerEntity) === -1)
                return;

            //get the arrow set up
            let arrowEntity = entities.create();
            //add components
            entities.addComponent(arrowEntity, "model");
            entities.addComponent(arrowEntity, "velocity");
            entities.addComponent(arrowEntity, "velocityParameters");
            entities.addComponent(arrowEntity, "collision");
            //grab components
            let arrowModel         = entities.getComponent(arrowEntity, "model");
            let velocity           = entities.getComponent(arrowEntity, "velocity");
            let velocityParameters = entities.getComponent(arrowEntity, "velocityParameters");
            let collision          = entities.getComponent(arrowEntity, "collision");

            //who the bullets can hurt...
            //the following line hacky and bad and stupid and I should feel hacky and bad and stupid
            collision.targetType = attackerModelName === "player" ? "ai" : "client";
            
            //stick the arrow in their gun
            arrowModel.position.fromArray(arrowOrigins[attackerModelName]);
            arrowModel.position.multiply(attackerModel.scale);
            //these next commands spin the arrow position if the attacker is rotated
            attackerModel.updateMatrixWorld();
            arrowModel.position.copy(attackerModel.localToWorld(arrowModel.position));

            //configure the flightpath
            velocity.subVectors(targetPos, arrowModel.position).normalize();
            velocity.multiplyScalar(20 + Math.random()*10);
            velocityParameters.gravityOn  = false;
            velocityParameters.frictionOn = true;
            velocityParameters.friction   = 0.3 + Math.random()*0.1;

            //make sure the arrow points in the right direction
            arrowModel.lookAt(targetPos);

            //remove the arrow after a while
            let arrowDespawnTimeout = setTimeout(
                () =>
                {
                    collision.emitter.removeAllListeners("hit");
                    entities.destroy(arrowEntity);
                    broadcast('entityDespawn', arrowEntity);
                },
                15000
            );

            //let the attacker know about the new arrow
            broadcast('entitySpawn', {
                components: [
                    "modelName"
                ],
                componentOverrides: {
                    serverId: arrowEntity,
                    modelName: "arrow"
                },
                position:    arrowModel.position  .toArray(),
                quaternion:  arrowModel.quaternion.toArray()
            });

            //do damage once the arrow is removed.
            collision.emitter.on('hit', function dealDamage(hitType, hitEntity)
            {
                entities.removeComponent(arrowEntity, "collision");

                if(hitType === "target")
                    setImmediate(() =>
                    {
                        //in case the target died while the arrow was flying.
                        if(entities.find('health').indexOf(hitEntity) !== -1)
                        {
                            //health reduction
                            let health = entities.getComponent(hitEntity, 'health');
                            if(health)
                                health.val -= attack.damage;

                            //speed reduction
                            let ai = entities.getComponent(hitEntity, 'ai');
                            if(ai && (attack.slowSpeedBy !== undefined))
                                ai.speed *= attack.slowSpeedBy;
                        }

                        entities.destroy(arrowEntity);
                        broadcast('entityDespawn', arrowEntity);

                        clearTimeout(arrowDespawnTimeout);
                    });

                else if(hitType === "map")
                    entities.getComponent(arrowEntity, "velocity").set(0, 0, 0);
            });
        },
        350
    );
}


//event listeners
entities.emitter.on('combatCreate', entity =>
{
    let combat = entities.getComponent(entity, "combat");


    const launchRangedAttack = attackData =>
    {
        let attack = entities.getComponent(entity, "weapon").attacks[attackData.attackIndex];

        for(let i = 0; i < (attack.shotsFired || 1); i++)
            setTimeout(
                () =>
                {
                    if(entities.find('model').indexOf(combat.target) !== -1)
                        rangedAttack(entity, attackData);
                },
                Math.random() * 175
            );
    }

    combat.emitter.on('launchRangedAttack', launchRangedAttack);


    entities.emitter.on('combatRemove', function cleanup(removedCombatEntity)
    {
        if(removedCombatEntity === entity)
        {
            entities.emitter.removeListener('launchRangedAttack', launchRangedAttack);
            entities.emitter.removeListener('combatRemove',       cleanup);
        }
    });
});


//ECS exports
module.exports = {
    load: new Promise((resolve, reject) =>
    {
        fs.readFile('./gamedata/arrowOrigins.json').then(originsData =>
        {
            arrowOrigins = JSON.parse(originsData);
            resolve();
        });
    }),
    update: (entity, delta) => {}
};