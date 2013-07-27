'use strict';

var HelloWorld = require('../../index');

describe("HelloWorld", function() {
    it("hello() should say hello when called", function() {
        expect(HelloWorld.sayHello()).toEqual("hi world");
    });
});

describe("HelloWorld2", function() {
    it("hello() should say hello when called", function() {
        expect(HelloWorld.sayHello()).toEqual("hiyaaa");
    });
});


