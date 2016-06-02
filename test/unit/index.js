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
            new Message(testUser, 'the kitchen', '456'),
            new Message(testUser, 'yes', '789')
        ];
        messenger = new utils.Messenger(bot, messages);
    });

    afterEach(function () {
        bot.shutdown(); //Cleanup to remove event listeners.
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
        var dialog;
        bot.respond(/clean the house/i, function (msg) {
            dialog = switchBoard.startDialog(msg);

            dialog.addChoice(/kitchen/, function () {
            });

            dialog.addChoice(/bathroom/, function () {
            });
        });

        messenger.next(function () {
            assert.strictEqual(dialog.getChoices().length, 2, 'There are two choices at this point');
            messenger.next(function () {
                assert.strictEqual(dialog.getChoices().length, 0, 'Choices should be cleared after a match.');
                done();
            });
        });
    });

    it('Clears the dialog choices after immediately after finding a match in a multi-level dialog', function (done) {
        var dialog;
        bot.respond(/clean the house/i, function (msg) {
            dialog = switchBoard.startDialog(msg);

            //Messages will be sent in nested fashion for this test.
            //messenger.next() activates the previously entered choice, so it look a bit backwards reading top to bottom.
            dialog.addChoice(/kitchen/, function () {
                assert.strictEqual(dialog.getChoices().length, 0, 'Choices should be cleared as soon as a match is found.');
                dialog.addChoice(/yes/i, function () {
                    assert.strictEqual(dialog.getChoices().length, 0, 'Choices should be cleared as soon as a match is found.');
                    done();
                });
                assert.strictEqual(dialog.getChoices().length, 1, 'After adding a new choice, there should only be one.');
                messenger.next(); //Yes
            });
            messenger.next(); //The kitchen
        });
        messenger.next(); //Clean The house
    });

    it('Clears the dialog if no choices are matched', function (done) {
        var dialog;

        bot.respond(/clean the house/i, function (msg) {
            dialog = switchBoard.startDialog(msg);
            dialog.addChoice(/can't touch this/, function () {
                throw new Error(); //Should never get here.
            });
        });

        //Pyramid of Doom!
        messenger.next(function () { //Starts the dialog
            assert.strictEqual(dialog.getChoices().length, 1, 'A single choice is registered');
            messenger.next(function () { //Sends kitchen, which won't be matched
                assert.strictEqual(dialog.getChoices().length, 0, 'Dialog should be cleared of choices');
                done();
            });
        });
    });


    it('Ends dialog after a set timeout with the default handler', function (done) {
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

    it('Ends dialog after a set timeout and timeout message with the default handler', function (done) {
        bot.respond(/the mission/i, function (msg) {
            var timeoutMessage = 'You took a little too long.';
            msg.reply('Your mission is to pass this unit test');
            msg.send('This dialog will self destruct in 200ms');
            var dialog = switchBoard.startDialog(msg, 100, timeoutMessage);
            msg.reply = function (text) {
                assert.strictEqual(text, timeoutMessage, 'Custom reply sent');
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
            dialog.addChoice(/accept/, function () { /*noop*/
            });
            dialog.dialogTimeout = function (originalMessage) {
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

});
