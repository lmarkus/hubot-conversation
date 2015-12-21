/**
 * Created by lmarkus on 9/30/15.
 */
'use strict';
module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt); // npm install --save-dev load-grunt-tasks

    grunt.initConfig({
            eslint: {
                target: ['test/unit/*.js', 'test/utils/*.js', 'index.js', 'lib/**/*.js']
            },
            mocha_istanbul: {
                coverUnit: {
                    src: 'test/unit/**/*.js',
                    options: {
                        coverageFolder: 'test/coverage/unit',
                        root: '.',
                        reportFormats: ['lcov'],
                        timeout: 20000,
                        'check-leaks': true,
                        ui: 'bdd',
                        reporter: 'spec',
                        check: {
                            statements: 100,
                            branches: 100,
                            functions: 100,
                            lines: 100
                        }
                    }
                }
            }
        }
    );

    grunt.registerTask('default', ['test']);
    grunt.registerTask('coverage', ['mocha_istanbul']);
    grunt.registerTask('test', ['eslint', 'mocha_istanbul']);
};
