/**
 * Created by lmarkus on 9/30/15.
 */
'use strict';
var Dialog = require('./Dialog');
module.exports = function Conversation(bot) {

    var _talkingTo = {},//TODO: Use the robot brain for this, it will probably be more scalable.
        spy = function (msg) {
            var user = msg.message.user.id;

            //Pass the message to users we have a dialog with.
            if (_talkingTo[user]) {
                _talkingTo[user].receive(msg);
            }
        };

    bot.hear(/.*/, spy);

    /**
     * Starts an empty conversation with the user associated to an incoming message
     * @param msg An incoming message on which to base a conversation
     * @param timeout (Optional), Default: 30000 ms Expiration time for the conversation.
     * @returns Dialog
     */
    this.startDialog = function startDialog(msg, timeout) {
        var id = msg.message.user.id,
            dialog = _talkingTo[id] = new Dialog(msg, timeout);

        dialog.on('timeout', function () {

            if (_talkingTo[id]) {
                var handler = _talkingTo[id].handler;
                delete _talkingTo[id];
                return typeof handler === 'function' && handler(msg);
            }
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
}
;
