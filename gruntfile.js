module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        //pkg: grunt.file.readJSON('package.json'),

        copy: {
            html: {
                files: [
                    {   expand: true,
                        cwd: 'resources/client/html/',
                        flatten: true, //copy without subdirectories
                        src: ['**'],
                        dest: 'public/',
                        filter: 'isFile'
                    }
                ]
            },
            js: {
                files: [
                    {   expand: true,
                        cwd: 'resources/client/js/',
                        flatten: true, //copy without subdirectories
                        src: ['*.min.js'],
                        dest: 'public/js/',
                        filter: 'isFile'
                    }
                ]
            }
        },
        concat: {
            options: {
                separator: ';', //good if minified
                sourceMap: true
            },
            tkvrJs: {
                src: [  'resources/client/js/tkvr-main-module.js',
                        'resources/client/js/tkvr-list-ctrl.js',
                        'resources/client/js/tkvr-view-ctrl.js',
                        'resources/client/js/tkvr-orientation.js',
                        'resources/client/js/tkvr-control-pointer-coords.js',
                        'resources/client/js/tkvr-fullscreen.js',
                        'resources/client/js/tkvr-socket-io-setup.js',
                        'resources/client/js/tkvr-control.js',
                        'resources/client/js/tkvr-control-button.js',
                        'resources/client/js/tkvr-control-slider.js',
                        'resources/client/js/tkvr-control-xy-pad.js'
                ],
                dest: 'public/js/tkvr.js'
            }
        },
        sass: {
            compile: {
                files: [{
                    expand: true,
                    cwd: 'resources/client/sass/',
                    src: ['main.scss'],
                    dest: 'public/css/',
                    ext: '.css'
                }]
            }
        },

        watch: {
            html: {
                files: ['resources/client/html/*.html'],
                tasks: ['copy:html'],
                options: {
                    spawn: false
                }
            },
            sass: {
                files: ['resources/client/sass/*.scss'],
                tasks: ['sass:compile'],
                options: {
                    spawn: false
                }
            },
            js: {
                files: ['resources/client/js/tkvr-*.js'],
                tasks: ['concat:tkvrJs'],
                options: {
                    spawn: false
                }
            }
        }
    });

    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task(s).
    //grunt.registerTask('publicWatcher', ['watch:html', 'watch:sass', 'watch:js']); //does not work, need extra task to watch multiple

};