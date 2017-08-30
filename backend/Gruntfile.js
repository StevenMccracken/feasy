module.exports = function grunt(_grunt) {
  _grunt.initConfig({
    pkg: _grunt.file.readJSON('package.json'),
    jasmine_node: {
      options: {
        forceExit: true,
        match: '.',
        matchall: false,
        extensions: 'js',
        specNameMatcher: 'spec',
      },
      all: ['spec/'],
    },
    shell: {
      mongo: {
        command: 'sh startMongoIfNotRunning.sh',
        options: {
          async: true,
          stderr: true,
          stdout: false,
        },
      },
    },
  });

  // Load npm libraries to initialize database and API tests
  _grunt.loadNpmTasks('grunt-shell-spawn');
  _grunt.loadNpmTasks('grunt-jasmine-node');

  // Start mongod process and then start the server
  _grunt.registerTask('startMongo', 'shell');
  _grunt.registerTask('testAPI', 'jasmine_node');
};
