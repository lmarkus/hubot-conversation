/**
 * Created by lmarkus on 9/30/15.
 */
'use strict';
var util = require('util'),
    c = require('./constants'),
    EventEmitter = require('events').EventEmitter,
    debug = require('debuglog')('HUBOT_CONVERSATION');

/**
 * A multiple-choice dialog. Keeps track of a set of regular expresions to match, and their function handlers.
 * A dialog has an expiration date, set by the timeoutValue (defaults to 30 seconds). If no answer has been
 * received from the user, the Dialog expires and removes itself from the switchboard.
 *
 * @param originalMessage The message that started the conversation
 * @param timeoutValue (Default: 30 seconds) The inactivity timeout of this dialog.
 * @param {String} [timeoutMessage='Timed out!, please start again.'] The inactivity message of this dialog
 * @constructor
 */
var Dialog = function Dialog(originalMessage, timeoutValue, timeoutMessage) {
    var expiration,
        self = this,
        choices = []
        ;

    timeoutValue = timeoutValue || c.DEFAULT_TIMEOUT;
    timeoutMessage = timeoutMessage || c.DEFAULT_TIMEOUT_MESSAGE;

    //Inject event emmiter properties
    EventEmitter.call(this);

    /********** Private timeout handlers *******************/
    /**
     * Starts the countdown to expiration
     */
    function startDialogTimeout() {
        //Clock starts ticking...
        expiration = setTimeout(function () {
            self.dialogTimeout(originalMessage);
            self.emit('timeout', originalMessage);
        }, timeoutValue);
    }

    /**
     *  Stop / Start utility method
     */
    function resetDialogTimeout() {
        clearTimeout(expiration);
        startDialogTimeout();
    }


    /********* Public API *************/

    /**
     * Accepts an incoming message, tries to match against the registered choices.
     * After a choice is made, the timer is cleared and the dialog ends.
     *
     * @param msg
     */
    this.receive = function (msg) {
        var text = msg.message.text,
            matched = false;

        //Stop at the first match in the order in which they were added.
        debug('Receiving message', choices);
        matched = choices.some(function (choice) {
            debug('Checking ' + text + ' vs ' + JSON.stringify(choice));
            var match = text.match(choice.regex);
            if (match) { //Accept message

                //By receiving a message, this step is considered complete (whether it matched or not). Clear choices and dialogTimeout
                self.resetChoices();
                clearTimeout(expiration);

                //Overrride the original match from the universal handler
                msg.match = match;
                choice.handler(msg);
                return true;
            }
        });

        //Failsafe clearing of choices if no match is found
        if (!matched) {
            self.resetChoices();
            clearTimeout(expiration);
        }
    };

    /**
     * Registers a new choice for this dialog
     * @param regex Expression to match
     * @param handler Handler function when matched
     */
    this.addChoice = function (regex, handler) {
        choices.push({regex: regex, handler: handler});

        //If we're adding choices, it means we're about to start a new round.
        resetDialogTimeout();
    };

    /**
     * Returns the array of choices.
     * @returns {Array}
     */
    this.getChoices = function () {
        return choices;
    };

    /**
     * Clears the choices array
     */
    this.resetChoices = function resetChoices() {
        debug('Reseting Choices');
        choices = [];
    };

    /**
     * Function to be executed when the timeout value has elapsed
     * @param msg The message that started this dialog
     */
    this.dialogTimeout = function (msg) {
        msg.reply(timeoutMessage);
    };


    //Start the clock on any new instance
    startDialogTimeout();
};

//Inherit event emitter properties
util.inherits(Dialog, EventEmitter);

module.exports = Dialog;
