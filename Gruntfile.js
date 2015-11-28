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
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', ['jasmine', 'jshint']);
};
