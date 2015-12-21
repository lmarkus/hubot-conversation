/**
 * Created by lmarkus on 9/30/15.
 */
'use strict';
var Dialog = require('./Dialog'),
    debug = require('debuglog')('HUBOT_CONVERSATION');

module.exports = function Conversation(bot) {

    var _talkingTo = {};//TODO: Use the robot brain for this, it will probably be more scalable.

    //Register a custom listener that will spy on all incoming messages
    bot.listen(
        function matcher(msg) {
            var user = msg.user.id;
            //If a dialog is currently open with this user, accept the message.
            debug('Checking if talking to   ' + user + ' = ' + !!_talkingTo[user]);
            return _talkingTo[user];
        },
        function spy(msg) {

            var user = msg.message.user.id;
            debug('Accepting message for ', user);
            _talkingTo[user].receive(msg);
        }
    );

    /**
     * Starts an empty conversation with the user associated to an incoming message
     * @param msg An incoming message on which to base a conversation
     * @param timeout (Optional), Default: 30000 ms Expiration time for the conversation.
     * @returns Dialog
     */
    this.startDialog = function startDialog(msg, timeout) {
        var id = msg.message.user.id,
            dialog = _talkingTo[id] = new Dialog(msg, timeout);

        //When the dialog times out, unregister it.
        dialog.on('timeout', function () {
            delete _talkingTo[id];
        });
        return dialog;
    };

    /**
     * Returns an existing Dialog with a given user id.
     * @param userId
     * @returns {*}
     */
    this.talkingTo = function talkingTo(userId) {
        return _talkingTo[userId];
    };
};

