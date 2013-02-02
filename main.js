
// on DOM ready
cul.ready( function()
{
	// initialize cul, canvas context etc.
	var ctx = cul.create('My game', 1024, 768, true);

	cul.run();
});

cul.init( function()
{
	// on cul initialized
	// initialize your game
});

cul.update( function()
{
	// game logic here

	if (cul.keypressed(CUL.KEY.UP))
	{
		// if up arrow key is pressed
	}

	if (cul.keydown(CUL.KEY.A))
	{
		// if A key is pressed down
	}

	if (cul.mousepressed(CUL.KEY.MOUSE_LEFT))
	{
		// if left mouse key is pressed
	}

	// get mouse position
	var mouse_pos = cul.mousepos();
});

cul.render( function()
{
	// rendering here

	// check number of frames per second
	var fps = cul.get_fps();
});
