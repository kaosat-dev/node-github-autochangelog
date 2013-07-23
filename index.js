// a convenience function, usage:
// var DbStorage = require('coscad-DbStorage')(core)

module.exports = function(core, opts) {
  
}

// expose the DbStorage constructor so that it is available
// in case someone wants to access the .prototype methods, etc
module.exports.Thingamagic = Thingamagic
module.exports.sayHello = sayHello

function Thingamagic(core, opts) {
  // protect against people who forget 'new'
  if (!(this instanceof Thingamagic)) return new Thingamagic(core, opts)

  // we need to store the passed in variables on 'this'
  // so that they are available to the .prototype methods
  this.core = core
  this.opts = opts || {}

}

function sayHello()
{
	return("hi world");
}

