module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        //pkg: grunt.file.readJSON('package.json'),

        copy: {
            html: {
                files: [
                    {   expand: true,
                        cwd: 'ressources/html/',
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
                        cwd: 'ressources/js/',
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
                    cwd: 'ressources/sass/',
                    src: ['main.scss'],
                    dest: 'public/css/',
                    ext: '.css'
                }]
            }
        },

        watch: {
            html: {
                files: ['ressources/html/*.html'],
                tasks: ['copy:html'],
                options: {
                    spawn: false
                }
            },
            sass: {
                files: ['ressources/sass/*.scss'],
                tasks: ['sass:compile'],
                options: {
                    spawn: false
                }
            },
            js: {
                files: ['ressources/js/*.js'],
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