/**
 * Created by lmarkus on 9/30/15.
 */
'use strict';
var util = require('util'),
    c = require('./constants'),
    EventEmitter = require('events');


var Dialog = function Dialog(originalMessage, timeout) {
    var expiration,
        self = this,
        choices = []
        ;

    timeout = timeout || c.DEFAULT_TIMEOUT;

    //Inject event emmiter properties
    EventEmitter.call(this);

    //Clock starts ticking...
    expiration = setTimeout(function () {
        self.timeout(originalMessage);
    }, timeout);

    /**
     * Accepts an incoming message, tries to match against the registered choices.
     * After a choice is made, the timer is cleared and the dialog ends.
     *
     * @param msg
     */
    this.receive = function (msg) {
        //Stop at the first match in the order in which they were added.
        var matched = choices.some(function (choice) {
            var match = msg.message.text.match(choice.regex);
            if (match) {
                //Clear choices since a match was found.
                self.reset();

                //Overrride the original match from the universal handler
                msg.match = match;
                choice.handler(msg);
                return true;
            }
        });
        if (!matched) {
            self.reset();
        }
    };

    this.addChoice = function (regex, handler) {
        choices.push({regex: regex, handler: handler});
    };

    this.getChoices = function () {
        return choices;
    };

    this.timeout = function (msg) {
        self.emit('timeout', msg);
        msg.reply(c.DEFAULT_TIMEOUT_MESSAGE);
    };

    this.reset = function reset() {
        choices = [];
        clearTimeout(expiration);
    };
};

//Inherit event emitter properties
util.inherits(Dialog, EventEmitter);

module.exports = Dialog;
