/**
 * Created by lmarkus on 9/30/15.
 */
/*eslint max-nested-callbacks:[0]*/
'use strict';
require('coffee-script/register');

var hubot = require('hubot'),
    Robot = hubot.Robot,
    Message = hubot.TextMessage,
    utils = require('../utils'),
    assert = require('chai').assert,
    Conversation = require('../../'),
    c = require('../../lib/constants'),
    Dialog = require('../../lib/Dialog'),
    testUser = new hubot.User('Lenny', {room: 'The Lounge'})
    ;

describe('#Hubot Conversation', function () {
    var bot, switchBoard, messenger, messages;

    beforeEach(function () {
        //reset the bot;
        bot = new Robot('hubot/src/adapters', 'shell');
        switchBoard = new Conversation(bot);
        messages = [
            new Message(testUser, 'hubot clean the house', '123'),
            new Message(testUser, 'the kitchen', '456')
        ];
        messenger = new utils.Messenger(bot, messages);
    });

    it('Registers universal listener', function () {

        /*eslint no-unused-vars: [0]*/
        var before = bot.listeners.length,
            conv = new Conversation(bot),
            after = bot.listeners.length;
        assert.strictEqual(after - before, 1, 'Registered a single listener');

    });

    it('Starts a conversation with a user', function (done) {
        bot.respond(/FooBar/i, function (msg) {
            switchBoard.startDialog(msg);
            assert.ok(switchBoard.talkingTo(msg.message.user.id), 'Conversation has begun');
            done();
        });
        bot.receive(new Message(testUser, 'hubot FooBar', '123'));
    });


    it('Dialog can recognize next input', function (done) {

        bot.respond(/clean the house/i, function (msg) {
            var dialog = switchBoard.startDialog(msg);
            msg.reply('Should I start with the kitchen or the bathroom?');

            dialog.addChoice(/(kit)chen/, function (msg2) {
                msg2.reply('Ok! Cleaning the kitchen');
                done();
            });

            messenger.next();
        });

        messenger.next();
    });

    it('Clears the dialog choices after finding a match', function (done) {
        bot.respond(/clean the house/i, function (msg) {
            var dialog = switchBoard.startDialog(msg);

            dialog.addChoice(/kitchen/, function () {
                assert.strictEqual(dialog.getChoices().length, 0, 'Choices should be cleared after a match.');
                done();
            });

            dialog.addChoice(/bathroom/, function () {
            });
            assert.strictEqual(dialog.getChoices().length, 2, 'There are two choices at this point');
            messenger.next();
        });

        messenger.next();
    });


    it('Ends dialog after a set timeout with the default handler', function (done) {
        this.timeout(200); //<--- This is just a mocha timeout so the unit test ends faster. It's not the actual Dialog timeout
        bot.respond(/the mission/i, function (msg) {
            msg.reply('Your mission is to pass this unit test');
            msg.send('This dialog will self destruct in 200ms');
            var dialog = switchBoard.startDialog(msg, 100);
            msg.reply = function (text) {
                assert.strictEqual(text, c.DEFAULT_TIMEOUT_MESSAGE, 'Default reply sent');
                done();
            };
        });
        bot.receive(new Message(testUser, 'hubot the mission', 123));
    });

    it('Ends dialog after a set timeout with a custom handler', function (done) {
        this.timeout(200); //<--- This is just a mocha timeout so the unit test ends faster. It's not the actual Dialog timeout
        bot.respond(/the mission/i, function (msg) {
            msg.reply('Your mission is to pass this unit test');
            msg.send('This dialog will self destruct in 100ms');
            var dialog = switchBoard.startDialog(msg, 100);
            dialog.timeout = function (originalMessage) {
                originalMessage.send('Boom');
                done();
            };
        });
        bot.receive(new Message(testUser, 'hubot the mission', 123));
    });

    it('Emits "timeout" event', function (done) {
        bot.respond(/.*/i, function (msg) {
            var d = new Dialog(msg, 100);
            d.on('timeout', function () {
                done();
            });
        });
        messenger.next();
    });

    it('Ends dialog after a timeout', function (done) {
        bot.respond(/.*/i, function (msg) {
            var id = msg.message.user.id;
            var d = switchBoard.startDialog(msg, 100);
            assert.isDefined(
                switchBoard.talkingTo(id), 'Ongoing Dialog');
            d.on('timeout', function () {
                assert.isUndefined(switchBoard.talkingTo(id), 'Dialog Ended');
                done();
            });
        });
        messenger.next();
    });
    it.skip('Overrides the matched results from the universal listener');
    it.skip('Does not try to match anything else after a choice is matched');
    it.skip('Clears the choices if no input is found');

});
