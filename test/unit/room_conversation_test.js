/**
 * Created by Ivan Dmitriev on /30/15.
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
    testUser = new hubot.User('Lenny', {room: 'The Lounge'}),
    testUserSameRoom = new hubot.User('Jonny', {room: 'The Lounge'}),
    testUserDiffRoom = new hubot.User('Lenny', {room: 'Another room'})
    ;

describe('#Hubot Room Conversation', function () {
    var bot, roomSwitchBoard, roomMessages, messenger;

    beforeEach(function () {
        //reset the bot;
        bot = new Robot('hubot/src/adapters', 'shell');
        roomSwitchBoard = new Conversation(bot, 'room');
    });

    afterEach(function () {
        bot.shutdown();
    });

    it('Starts a conversation in room', function (done) {
        bot.respond(/FooBar/i, function (msg) {
            roomSwitchBoard.startDialog(msg);
            assert.ok(roomSwitchBoard.talkingTo(msg.message.room), 'Conversation has begun');
            done();
        });
        bot.receive(new Message(testUser, 'hubot FooBar', '123'));
    });


    it('Dialog can recognize next input from different users in a room', function (done) {
        roomMessages = [
            new Message(testUser, 'hubot clean the house', '123'),
            new Message(testUserSameRoom, 'the kitchen', '456'),
            new Message(testUser, 'yes', '789')
        ];
        messenger = new utils.Messenger(bot, roomMessages);

        bot.respond(/clean the house/i, function (msg) {
            var dialog = roomSwitchBoard.startDialog(msg);
            msg.reply('Should I start with the kitchen or the bathroom?');

            dialog.addChoice(/(kit)chen/, function (msg2) {
                msg2.reply('Ok! Cleaning the kitchen');
                done();
            });

            messenger.next();
        });

        messenger.next();
    });

    it('Dialog can recognize next input from the same room only', function (done) {
        roomMessages = [
            new Message(testUser, 'hubot clean the house', '123'),
            new Message(testUserDiffRoom, 'the kitchen', 'diff room 456'),
            new Message(testUserSameRoom, 'the kitchen', '456'),
            new Message(testUser, 'yes', '789')
        ];
        messenger = new utils.Messenger(bot, roomMessages);

        bot.respond(/clean the house/i, function (msg) {
            var dialog = roomSwitchBoard.startDialog(msg);
            msg.reply('Should I start with the kitchen or the bathroom?');

            dialog.addChoice(/(kit)chen/, function (msg2) {
                msg2.reply('Ok! Cleaning the kitchen');
                if (msg2.message.id !== '456') {
                    throw new Error('This user message from different room, it should be ignored.');
                }
                done();
            });

            messenger.next();
            messenger.next();
        });

        messenger.next();
    });

});
