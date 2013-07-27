'use strict';
//TODO add actual tests
var HelloWorld = require('../../bin/autoChangeLog.js');

describe("HelloWorld", function() {
    it("hello() should say hello when called", function() {
        expect(HelloWorld.sayHello()).toEqual("hi world");
    });
});


