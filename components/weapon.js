(function()
{
	//requires
	var THREE;


	var exportObject = {
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}),
		factory: () =>
		{
			return {
				name: 	undefined,
				model: 	undefined,
			}
		}
	}

	if(typeof window === "undefined")
	{
		THREE = require('three');

		module.exports = exportObject;
	}

	else
		define(['../lib/three.js'], (threefile) =>
		{
			THREE = threefile;
			return exportObject;
		});
})();