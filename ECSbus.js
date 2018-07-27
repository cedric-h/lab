const ecslib = require("./public/js/lib/ecs/index.js");

exports.ecs = new ecslib.EntityComponentSystem();
exports.entities = new ecslib.EntityPool();