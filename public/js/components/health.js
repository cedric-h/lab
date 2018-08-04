(function()
{
	var THREE;

	var exportObject = {
		serverAndClient: true,
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}),
		factory: () =>
		{
			return {
				val: 	undefined,
				max: 	undefined,
				dying: 	false,
			}
		},
		reset: health =>
		{
			health.val = undefined;
			health.dying = false;
		}
	}

	//exporting
	if(typeof window === "undefined")
	{
		THREE = require('three');

		module.exports = exportObject;
	}

	else
		define(['../lib/three.js'], threefile =>
		{
			THREE = threefile;

			return exportObject;
		});
})();