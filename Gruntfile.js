module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jasmine: {
      slice: {
        src: 'src/*.js',
        options: {
          specs: 'src/**test/*.js',
          vendor: 'node_modules/three.js/build/three.js'
        }
      }
    },
    jshint: {
      all: ['src/**/*.js']
    },
    copy: {
      slice: {
        src: 'src/slice.js',
        dest: 'build/slice.<%= pkg.version %>.js'
      }
    },
    uglify: {
      slice: {
        src: 'src/slice.js',
        dest: 'build/slice.<%= pkg.version %>.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('test', ['jasmine', 'jshint']);
  grunt.registerTask('build', ['copy', 'uglify']);
};
