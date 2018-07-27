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
				val: undefined,
				max: undefined
			}
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