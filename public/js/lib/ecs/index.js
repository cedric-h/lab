if(typeof window === "undefined")
{
	module.exports = {
		EntityComponentSystem: require("./entity-component-system"),
		EntityPool: require("./entity-pool")
	};
}

else {
	define(["./entity-component-system.js", "./entity-pool.js"], (EntityComponentSystem, EntityPool) =>
	{
		return {
			EntityComponentSystem: EntityComponentSystem,
			EntityPool: EntityPool
		}
	});
}