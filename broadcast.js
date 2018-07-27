module.exports = (tag, data, butNotTo) =>
{
	entities.find('client').forEach(entity =>
    {
    	if(entity !== butNotTo)
    	{
	        let client = entities.getComponent(entity, 'client');
	        client.send(tag, data);
    	}
    });
}