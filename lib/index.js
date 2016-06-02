/**
 * Created by lmarkus on 9/30/15.
 */
'use strict';
var Dialog = require('./Dialog'),
    debug = require('debuglog')('HUBOT_CONVERSATION');

module.exports = function Conversation(bot, type) {

    var _talkingTo = {};//TODO: Use the robot brain for this, it will probably be more scalable.
    type = type || 'user';

    var getId = function(msg) {
        return (type === 'user')? msg.user.id : msg.room;
    };

    //Register a custom listener that will spy on all incoming messages
    bot.listen(
        function matcher(msg) {
            var id = getId(msg);
            //If a dialog is currently open with this user, accept the message.
            debug('Checking if talking to   ' + id + ' = ' + !!_talkingTo[id]);
            return _talkingTo[id];
        },
        function spy(msg) {
            var id = getId(msg.message);
            debug('Accepting message for ', id);
            _talkingTo[id].receive(msg);
        }
    );

    /**
     * Starts an empty conversation with the user or room associated to an incoming message
     * @param msg An incoming message on which to base a conversation
     * @param timeout (Optional), Default: 30000 ms Expiration time for the conversation.
     * @param {String} [timeoutMessage='Timed out!, please start again.'] The inactivity message of this dialog
     * @returns Dialog
     */
    this.startDialog = function startDialog(msg, timeout, timeoutMessage) {
        var id = getId(msg.message),
            dialog = _talkingTo[id] = new Dialog(msg, timeout, timeoutMessage);

        //When the dialog times out, unregister it.
        dialog.on('timeout', function () {
            delete _talkingTo[id];
        });
        return dialog;
    };

    /**
     * Returns an existing Dialog with a given user or room id.
     * @param userId
     * @returns {*}
     */
    this.talkingTo = function talkingTo(id) {
        return _talkingTo[id];
    };
};
