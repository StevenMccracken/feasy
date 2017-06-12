module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jasmine_node: {
      options: {
        forceExit: true,
        match:'.',
        matchall: false,
        extensions: 'js',
        specNameMatcher: 'spec'
      },
      all:['spec/']
    },
    shell: {
      mongo: {
        command: "sh startMongoIfNotRunning.sh",
        options: {
          async: true,
          stderr: true,
          stdout: false,
        }
      }
    }
  });

  // Load npm libraries to initialize database and API tests
  grunt.loadNpmTasks('grunt-shell-spawn');
  grunt.loadNpmTasks('grunt-jasmine-node');

  // Start mongod process and then start the server
  grunt.registerTask('startMongo', 'shell');
  grunt.registerTask('testAPI', 'jasmine_node');
};
