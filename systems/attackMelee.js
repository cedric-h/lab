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


//helper functions
function updateWithinRange(attackerEntity)
{
    //attacker components
    let combat        = entities.getComponent(attackerEntity, "combat");
    let weapon        = entities.getComponent(attackerEntity, "weapon");
    let attackerModel = entities.getComponent(attackerEntity, "model");

    if(entities.find('model').indexOf(combat.target) !== -1)
    {
        //target components
        let targetModel = entities.getComponent(combat.target, "model");

        let reach = weapon.reach * ((attackerModel.scale.x + attackerModel.scale.y)/2);
        combat.withinRange = attackerModel.position.distanceTo(targetModel.position) < reach;
    }
}

function shouldAttack(attackerEntity)
{
    //attacker components
    let combat        = entities.getComponent(attackerEntity, "combat");
    let weapon        = entities.getComponent(attackerEntity, "weapon");
    let attackerModel = entities.getComponent(attackerEntity, "model");

    if(entities.find('model').indexOf(combat.target) !== -1)
    {
        //target components
        let targetModel = entities.getComponent(combat.target, "model");

        updateWithinRange(attackerEntity);

        let direction = Math.atan2(
            targetModel.position.y - attackerModel.position.y,
            targetModel.position.x - attackerModel.position.x
        );
        let attackerDirection = attackerModel.rotation.z;

        return (
            attackerDirection < direction + 0.09 &&
            attackerDirection > direction - 0.09 &&
            combat.withinRange
        );
    }
}

function meleeAttack(attackerEntity)
{
    //attacker components
    let combat        = entities.getComponent(attackerEntity, "combat");
    let weapon        = entities.getComponent(attackerEntity, "weapon");
    let client        = entities.getComponent(attackerEntity, "client");
    let attackerModel = entities.getComponent(attackerEntity, "model");
    //target components
    let health      = entities.getComponent(combat.target,  "health");
    let targetModel = entities.getComponent(combat.target,  "model");

    if(shouldAttack(attackerEntity))
    {
        broadcast('meleeAttack', attackerEntity);
        combat.lastAttackDate = Date.now();

        setTimeout(
            () =>
            {
                if(shouldAttack(attackerEntity))
                    health.val -= weapon.damage;
            },
            weapon.hitTime
        );
    }
}


//event listeners
entities.emitter.on('combatCreate', entity =>
{
    let combat = entities.getComponent(entity, "combat");


    const launchMeleeAttack = targetPos =>
        meleeAttack(entity, targetPos);

    combat.emitter.on('launchMeleeAttack', launchMeleeAttack);


    entities.emitter.on('combatRemove', function cleanup(removedCombatEntity)
    {
        if(removedCombatEntity === entity)
        {
            entities.emitter.removeListener('launchMeleeAttack',  launchMeleeAttack);
            entities.emitter.removeListener('combatRemove',       cleanup);
        }
    });
});

setInterval(
    () =>
    {
        entities.find('ai').forEach(entity =>
        {
            let weapon = entities.getComponent(entity, "weapon");
            let combat = entities.getComponent(entity, "combat");

            if(entities.find('model').indexOf(combat.target) === -1)
                combat.attackOn = false;

            else if(weapon && weapon.type === "melee")
            {
                if(combat.lastAttackDate === undefined)
                    combat.lastAttackDate = Date.now();

                if(combat.lastAttackDate + weapon.cooldown < Date.now())
                    meleeAttack(entity);

                else
                    updateWithinRange(entity);
            }
        });
    },
    100
);


//ECS exports
module.exports = {
    load: new Promise((resolve, reject) => resolve()),
    update: (entity, delta) => {}
};