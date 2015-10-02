/**
 * Created by lmarkus on 10/1/15.
 * Some utils for testing.
 */
'use strict';
module.exports.Messenger = function Messenger(bot, messages) {

    return {
        /**
         * Sends the next message in the array
         */
        next: function next(callback) {
            bot.receive(messages.shift(), function () {
                if (typeof callback === 'function') {
                    callback();
                }
            });
        },

        /**
         * Sends all messages with a 100 ms interval
         */
        sendAll: function sendAll() {
            messages.forEach(function (message, idx) {
                setTimeout(
                    function () {
                        bot.receive(message);
                    },
                    10 * idx
                );
            });
        }
    };
};
