/**
 * Created by lmarkus on 9/30/15.
 */
'use strict';
module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt); // npm install --save-dev load-grunt-tasks

    grunt.initConfig({
        eslint: {
            target: ['test/unit/*.js','test/utils/*.js', 'index.js', 'lib/**/*.js']
        }
    });

    grunt.registerTask('default', ['test']);
    grunt.registerTask('test', ['eslint']);
};
