/**
 * Canvas Utility Library
 *
 * Copyright (c) 2012-2014 wesz/ether (onether.com)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

window.CUL = (function(_cul)
{
	_cul = function(element, width, height, center, context)
	{
		var _cul = this;

		_cul.init_callback = null;
		_cul.render_callback = null;
		_cul.update_callback = null;
		_cul.focus_callback = null;
		_cul.blur_callback = null;
		_cul.canvas = null;
		_cul.context = null;
		_cul.fps = 60;
		_cul.keys = [];
		_cul.offset = { x: 0, y: 0 };
		_cul.mouse = { x: 0, y: 0, wheel: { up: false, down: false }, button: []};
		_cul.browser = { width: 0, height: 0 };
		_cul.screen = { width: 0, height: 0, center: false };
		_cul.tick = { prev: null, curr: null, fps: 0 };

		return _cul;
	};

	_cul.prototype.listen = function(event, element, callback)
	{
		if (element.addEventListener)
		{
			element.addEventListener(event, callback, false);
		} else if (element.attachEvent)
		{
			element.attachEvent('on' + event, callback);
		}
	};

	_cul.prototype.trigger = function(event, element)
	{
		if (typeof(element[event]) == 'function')
		{
			element[event]();
		}
	};

	_cul.prototype.run = function(fps)
	{
		var cul = this;

		if (cul.init_callback != null)
		{
			cul.init_callback();
			cul.init_callback = null;
		}

		if (typeof fps != 'undefined')
		{
			cul.fps = fps;
		}

		cul.tick.prev = new Date().getTime() / 1000;

		cul.loop();
	};

	_cul.prototype.loop = function()
	{
		var cul = this;

		cul.tick.curr = new Date().getTime() / 1000;

		var elapsed = cul.tick.curr - cul.tick.prev;

		cul.tick.fps = (1.0 / elapsed).toFixed(2);

		cul.tick.prev = cul.tick.curr;

		if (cul.update_callback != null)
		{
			cul.update_callback(cul.canvas, cul.context);

			cul.mouse.wheel.down = false;
			cul.mouse.wheel.up = false;

			for (var i = 0; i < 2; i++)
			{
				cul.mouse.button[i].down = false;
				cul.mouse.button[i].up = false;
			}

			for (var i = 0; i < 255; i++)
			{
				cul.keys[i].down = false;
				cul.keys[i].up = false;
			}
		}

		if (cul.render_callback != null)
		{
			cul.render_callback(cul.canvas, cul.context);
		}

		window.setTimeout(function() { cul.loop(); }, 1000.0 / cul.fps);
	};

	_cul.prototype.resize = function()
	{
		var cul = this;

		if ( ! window.innerWidth)
		{
			if ( ! (document.documentElement.clientWidth == 0))
			{
				cul.browser.width = document.documentElement.clientWidth;
				cul.browser.height = document.documentElement.clientHeight;
			} else
			{
				cul.browser.width = document.body.clientWidth;
				cul.browser.height = document.body.clientHeight;
			}
		} else
		{
			cul.browser.width = window.innerWidth;
			cul.browser.height = window.innerHeight;
		}

		cul.canvas.width = (cul.screen.width == null ? cul.browser.width : cul.screen.width);
		cul.canvas.height = (cul.screen.height == null ? cul.browser.height : cul.screen.height);
		cul.canvas.style.cssText = 'width: ' + cul.canvas.width + 'px; height: ' + cul.canvas.height + 'px' + (cul.screen.center ? ' position: absolute;' + (cul.screen.center ? ' left: ' + (cul.browser.width/2 - cul.context.canvas.width/2) + 'px; top: ' + (cul.browser.height/2 - cul.context.canvas.height/2) + 'px;' : '') : '');
	};

	_cul.prototype.bind = function(element, width, height, center, context)
	{
		var cul = this;

		element = element || 'cul';
		width = width || 320;
		height = height || 240;
		center = typeof center == 'undefined' ? true : center;
		context = context || '2d';

		cul.canvas = document.getElementById(element);

		if (typeof context == 'object')
		{
			cul.context = context;
		} else
		{
			cul.context = cul.canvas.getContext(context || '2d', { antialias: false/*, premultipliedAlpha: false, alpha: true*/ });
		}

		cul.resize();
		cul.listen('resize', window, function() { cul.resize(); });

		cul.screen.width = width;
		cul.screen.height = height;
		cul.screen.center = center;

		cul.listen('focus', cul.canvas, function()
		{
			cul.canvas.focused = true;

			if (cul.focus_callback != null)
			{
				cul.focus_callback();
			}
		});

		cul.listen('blur', cul.canvas, function()
		{
			cul.canvas.focused = false;

			if (cul.blur_callback != null)
			{
				cul.blur_callback();
			}
		});

		cul.listen('mousemove', window, function(e)
		{
			if (CUL.instancecount == 0 || cul.canvas.focused)
			{
				e = e || window.event;

				if (e.pageX || e.pageY)
				{
					cul.mouse.x = e.pageX;
					cul.mouse.y = e.pageY;
				} else
				{
					cul.mouse.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
					cul.mouse.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
				}

				cul.offset.x = cul.canvas.offsetParent.offsetLeft;
				cul.offset.y = cul.canvas.offsetParent.offsetTop;

				cul.mouse.x -= cul.canvas.offsetLeft;
				cul.mouse.y -= cul.canvas.offsetTop;
			}
		});

		for (var i = 0; i < 2; i++)
		{
			cul.mouse.button[i] = { down: false, up: false, state: _cul.KEY.IS_RELEASED };
		}

		cul.listen('mousedown', window, function(e)
		{
			if (CUL.instancecount == 0 || cul.canvas.focused)
			{
				if (e.which)
				{
					cul.mouse.button[0].down = (e.which == 1);
					cul.mouse.button[1].down = (e.which == 3);
				} else if (e.button)
				{
					cul.mouse.button[0].down = (e.button == 0);
					cul.mouse.button[1].down = (e.button == 2);
				}

				for (var i = 0; i < 2; i++)
				{
					if (cul.mouse.button[i].down)
					{
						cul.mouse.button[i].state = _cul.KEY.IS_PRESSED;
					}
				}
			}
		});

		cul.listen('mouseup', window, function(e)
		{
			if (e.which)
			{
				cul.mouse.button[0].up = (e.which == 1);
				cul.mouse.button[1].up = (e.which == 3);
			} else if (e.button)
			{
				cul.mouse.button[0].up = (e.button == 0);
				cul.mouse.button[1].up = (e.button == 2);
			}

			for (var i = 0; i < 2; i++)
			{
				if (cul.mouse.button[i].up)
				{
					cul.mouse.button[i].state = _cul.KEY.IS_RELEASED;
				}
			}
		});

		cul.listen('contextmenu', window, function(e)
		{
			e.preventDefault();
		});

		cul.listen('mousewheel', window, function(e)
		{
			var delta = 0;
			cul.mouse.wheel.up = false;
			cul.mouse.wheel.down = false;

			if (CUL.instancecount == 0 || cul.canvas.focused)
			{
				e = e || window.event;

				if (e.wheelDelta)
				{
					delta = event.wheelDelta / 120;

					if (window.opera)
					{
						delta = -delta;
					}
				} else if (e.detail)
				{
					delta = -e.detail / 3;
				}

				if (delta > 0)
				{
					cul.mouse.wheel.up = true;
				} else if (delta < 0)
				{
					cul.mouse.wheel.down = true;
				}
			}
		});

		for (var i = 0; i < 255; i++)
		{
			cul.keys[i] = { down: false, up: false, state: _cul.KEY.IS_RELEASED, once: false };
		}

		cul.listen('keydown', window, function(event)
		{
			if ((CUL.instancecount == 0 || cul.canvas.focused) && ! cul.keys[event.keyCode].once)
			{
				cul.keys[event.keyCode].down = true;
				cul.keys[event.keyCode].state = _cul.KEY.IS_PRESSED;
				cul.keys[event.keyCode].once = true;
			}
		});

		cul.listen('keyup', window, function(event)
		{
			cul.keys[event.keyCode].up = true;
			cul.keys[event.keyCode].once = false;
			cul.keys[event.keyCode].state = _cul.KEY.IS_RELEASED;
		});

		cul.canvas.width = (width == null ? cul.browser.width : width);
		cul.canvas.height = (height == null ? cul.browser.height : height);
		cul.canvas.style.cssText = 'width: ' + cul.canvas.width + 'px; height: ' + cul.canvas.height + 'px;' + (cul.screen.center ? ' position: absolute; left: ' + (cul.browser.width/2 - cul.canvas.width/2) + 'px; top: ' + (cul.browser.height/2 - cul.canvas.height/2) + 'px;' : '');

		cul.canvas.focused = false;
		cul.canvas.setAttribute('tabindex', CUL.instancecount);

		if (CUL.instancecount == 0)
		{
			cul.canvas.focus();
		}

		CUL.instancecount++;


		return cul.context;
	};

	_cul.prototype.render = function(callback)
	{
		var cul = this;

		cul.render_callback = callback;
	};

	_cul.prototype.update = function(callback)
	{
		var cul = this;

		cul.update_callback = callback;
	};

	_cul.prototype.init = function(callback)
	{
		var cul = this;

		cul.init_callback = callback;
	};

	_cul.prototype.focus = function(callback)
	{
		var cul = this;

		cul.focus_callback = callback;
	};

	_cul.prototype.blur = function(callback)
	{
		var cul = this;

		cul.blur_callback = callback;
	};

	_cul.prototype.keycode = function(key)
	{
		for (var k in _cul.CHAR[0])
		{
			if (_cul.CHAR[0][k] == key)
			{
				return k;
			}
		}

		return;
	};

	_cul.prototype.keydown = function(key)
	{
		var cul = this;

		if (typeof key == 'string')
		{
			key = cul.keycode(key);
		}

		if (typeof cul.keys[key] != 'undefined')
		{
			if (cul.keys[key].down)
			{
				return true;
			}
		}

		return false;
	};

	_cul.prototype.keyup = function(key)
	{
		var cul = this;

		if (typeof key == 'string')
		{
			key = cul.keycode(key);
		}

		if (typeof cul.keys[key] != 'undefined')
		{
			if (cul.keys[key].up)
			{
				return true;
			}
		}

		return false;
	};

	_cul.prototype.keypressed = function(key)
	{
		var cul = this;

		if (typeof key == 'string')
		{
			key = cul.keycode(key);
		}

		if (typeof cul.keys[key] != 'undefined')
		{
			if (cul.keys[key].state == _cul.KEY.IS_PRESSED)
			{
				return true;
			}
		}

		return false;
	};

	_cul.prototype.mousedown = function(button)
	{
		var cul = this;

		if (cul.mouse.button[button].down)
		{
			return true;
		}

		return false;
	};

	_cul.prototype.mouseup = function(button)
	{
		var cul = this;

		if (cul.mouse.button[button].up)
		{
			return true;
		}

		return false;
	};

	_cul.prototype.mousepressed = function(button)
	{
		var cul = this;

		if (cul.mouse.button[button].state == _cul.KEY.IS_PRESSED)
		{
			return true;
		}

		return false;
	};

	_cul.prototype.mousewheelup = function()
	{
		var cul = this;

		return cul.mouse.wheel.up;
	};

	_cul.prototype.mousewheeldown = function()
	{
		var cul = this;

		return cul.mouse.wheel.down;
	};

	_cul.prototype.mousepos = function(relative)
	{
		var cul = this;

		return { x: cul.mouse.x - (relative ? cul.offset.x : 0), y: cul.mouse.y - (relative ? cul.offset.y : 0) };
	};

	_cul.prototype.get_fps = function()
	{
		var cul = this;

		return Math.floor(cul.fps);
	};

	_cul.prototype.extend = function(from, to)
	{
		var cul = this;

		if (from == null || typeof from != 'object')
		{
			return from;
		}

		if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function || from.constructor == String || from.constructor == Number || from.constructor == Boolean)
		{
			return new from.constructor(from);
		}

		to = to || new from.constructor();

		for (var name in from)
		{
			to[name] = typeof to[name] == 'undefined' ? cul.extend(from[name], null) : from[name];
		}

		return to;
	};

	_cul.instancecount = 0;

	_cul.KEY =
	{
		IS_PRESSED: 0,
		IS_RELEASED: 1,
		IS_DOWN: 2,
		IS_UP: 3,
		SPACE: 32,
		BACKSPACE: 8,
		TAB: 9,
		ENTER: 13,
		SHIFT: 16,
		CTRL: 17,
		ALT: 18,
		PAUSE: 19,
		CAPS_LOCK: 20,
		ESCAPE: 27,
		PAGE_UP: 33,
		PAGE_DOWN: 34,
		END: 35,
		HOME: 36,
		LEFT: 37,
		UP: 38,
		RIGHT: 39,
		DOWN: 40,
		INSERT: 45,
		DELETE: 46,
		0: 48,
		1: 49,
		2: 50,
		3: 51,
		4: 52,
		5: 53,
		6: 54,
		7: 55,
		8: 56,
		9: 57,
		A: 65,
		B: 66,
		C: 67,
		D: 68,
		E: 69,
		F: 70,
		G: 71,
		H: 72,
		I: 73,
		J: 74,
		K: 75,
		L: 76,
		M: 77,
		N: 78,
		O: 79,
		P: 80,
		Q: 81,
		R: 82,
		S: 83,
		T: 84,
		U: 85,
		V: 86,
		W: 87,
		X: 88,
		Y: 89,
		Z: 90,
		WINDOW_LEFT: 91,
		WINDOW_RIGHT: 92,
		SELECT_KEY: 93,
		NUMPAD_0: 96,
		NUMPAD_1: 97,
		NUMPAD_2: 98,
		NUMPAD_3: 99,
		NUMPAD_4: 100,
		NUMPAD_5: 101,
		NUMPAD_6: 102,
		NUMPAD_7: 103,
		NUMPAD_8: 104,
		NUMPAD_9: 105,
		MULTIPLY: 106,
		ADD: 107,
		SUBSTRACT: 109,
		DECIMAL: 110,
		DIVIDE: 111,
		F1: 112,
		F2: 113,
		F3: 114,
		F4: 115,
		F5: 116,
		F6: 117,
		F7: 118,
		F8: 119,
		F9: 120,
		F10: 121,
		F11: 122,
		F12: 123,
		NUM_LOCK: 144,
		SCROLL_LOCK: 145,
		SEMI_COLON: 186,
		EQUAL: 187,
		COMMA: 188,
		DASH: 189,
		PERIOD: 190,
		SLASH: 191,
		BRACKET_OPEN: 219,
		BACKSLASH: 220,
		BRACKET_CLOSE: 221,
		QUOTE: 222,
		MOUSE_LEFT: 0,
		MOUSE_RIGHT: 1,
		MOUSE_WHEEL_UP: 2,
		MOUSE_WHEEL_DOWN: 3
	};

	_cul.CHAR =
	[{
		32: ' ',
		222: '\'',
		188: ',',
		189: '-',
		190: '.',
		191: '/',
		48: '0',
		49: '1',
		50: '2',
		51: '3',
		52: '4',
		53: '5',
		54: '6',
		55: '7',
		56: '8',
		57: '9',
		186: ';',
		65: 'a',
		66: 'b',
		67: 'c',
		68: 'd',
		69: 'e',
		70: 'f',
		71: 'g',
		72: 'h',
		73: 'i',
		74: 'j',
		75: 'k',
		76: 'l',
		77: 'm',
		78: 'n',
		79: 'o',
		80: 'p',
		81: 'q',
		82: 'r',
		83: 's',
		84: 't',
		85: 'u',
		86: 'v',
		87: 'w',
		88: 'x',
		89: 'y',
		90: 'z',
		219: '[',
		187: '=',
		221: ']',
	},
	{
		32: ' ',
		222: '"',
		188: '<',
		189: '_',
		190: '>',
		191: '?',
		48: ')',
		49: '!',
		50: '@',
		51: '#',
		52: '$',
		53: '%',
		54: '^',
		55: '&',
		56: '*',
		57: '(',
		186: ':',
		65: 'A',
		66: 'B',
		67: 'C',
		68: 'D',
		69: 'E',
		70: 'F',
		71: 'G',
		72: 'H',
		73: 'I',
		74: 'J',
		75: 'K',
		76: 'L',
		77: 'M',
		78: 'N',
		79: 'O',
		80: 'P',
		81: 'Q',
		82: 'R',
		83: 'S',
		84: 'T',
		85: 'U',
		86: 'V',
		87: 'W',
		88: 'X',
		89: 'Y',
		90: 'Z',
		219: '{',
		187: '+',
		221: '}',
	}];

	_cul.ready = function(callback)
	{
		var add_listener = document.addEventListener || document.attachEvent;
		var remove_listener = document.removeEventListener || document.detachEvent;
		var event_name = document.addEventListener ? 'DOMContentLoaded' : 'onreadystatechange';

		add_listener.call(document, event_name, function()
		{
			remove_listener(event_name, arguments.callee, false);

			callback();
		}, false);
	};

	return _cul;
}(window.CUL || {}));
