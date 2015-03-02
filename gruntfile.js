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
                        src: ['**'],
                        dest: 'public/js/',
                        filter: 'isFile'
                    }
                ]
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
                files: ['resources/client/js/*.js'],
                tasks: ['copy:js'],
                options: {
                    spawn: false
                }
            }
        }
    });

    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task(s).
    grunt.registerTask('publicWatcher', ['watch:html', 'watch:sass', 'watch:js']);

};