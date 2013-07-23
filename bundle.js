;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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


},{}]},{},[1])
;