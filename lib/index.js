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

    return {
        startDialog: function (msg, timeout) {
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
        },
        talkingTo: function talkingTo(userId) {
            return _talkingTo[userId];
        }

    };
}
;
