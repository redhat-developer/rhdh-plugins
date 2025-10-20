module.exports = (grunt) ->
  # Project configuration.
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    coffee:
      compile:
        expand: true
        cwd: './'
        src: ['bin/**/*.coffee', 'lib/**/*.coffee']
        dest: './'
        ext: '.js'
      compileTestSpecs:
        expand: true
        cwd: 'test'
        src: ['**/*.spec.coffee']
        dest: 'test'
        ext: '.spec.js'
    coffeelint:
      # global options
      options:
        max_line_length:
          value: 120
          level: 'warn'
      app: ['bin/**/*.coffee', 'lib/**/*.coffee']
    watch:
      app:
        files: '**/*.coffee'
        tasks: ['coffee:compile']

  grunt.loadNpmTasks 'grunt-coffeelint'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  grunt.registerTask 'check', ['coffeelint']
  grunt.registerTask 'compile', ['coffee:compile']
  grunt.registerTask 'compile-tests', ['coffee:compileTestSpecs']
  grunt.registerTask 'compile-all', ['compile', 'compile-tests']
  grunt.registerTask 'build', ['check', 'compile']
  grunt.registerTask 'build-all', ['check', 'compile-all']
  grunt.registerTask 'default', ['build']