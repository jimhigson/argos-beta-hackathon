'use strict';

module.exports = function (grunt) {

   // set up config
   grunt.initConfig({
      pkg: grunt.file.readJSON('package.json')
      ,
      watch:{
         sources:{
            files:['*.js', 'sass/*.scss'],
            tasks:['build', 'develop:server'],
            options: { nospawn: true }
         }
      }
      ,
      sass: {
         all:{
            files: [
               {
                  expand: true,
                  cwd: 'sass',
                  src: ['*.scss'],
                  dest: 'statics/css',
                  ext: '.css',
                  extDot: 'first'
               }
            ]
         }
      }
      ,
      develop: {
         server: {
            file: 'index.js',
            args: '--env=dev'
         }
      }

      ,
      uglify: {

         clientSideJs:{
            options:{
               wrap:'enclose'
            },

            files:{
               'statics/js-concat/all.js':
                  require('./jsSourcesList.js').map(function(name){
                     return 'statics' + name;
                  })
            }
         }
      }
      ,
      cssmin:{
         minifyCss:{
            files:{
               'statics/css-min/all.css':'statics/css/*.css'
            }
         }
      }

   });

   grunt.registerTask("serversideJasmine", "Runs jasmine tests in node", function() {

      require('jasmine-node').executeSpecsInFolder({

         "specFolders":[process.cwd() + '/test/specs/unit'],
         "isVerbose":true,
         "showColors":true,
         "teamcity":false,
         "useRequireJs":false,
         "regExpSpec":/\.spec\.(js)$/,
         "junitreport":{"report":false, "savePath":"./reports/", "useDotNotation":true, "consolidate":true},
         "includeStackTrace":true,
         "growl":false,
         onComplete: this.async()
      });
   });   
   

   // load all grunt tasks
   grunt.loadNpmTasks('grunt-contrib-watch');
   grunt.loadNpmTasks('grunt-develop');
   grunt.loadNpmTasks('grunt-sass');
   grunt.loadNpmTasks('grunt-contrib-uglify');
   grunt.loadNpmTasks('grunt-contrib-cssmin');
   grunt.loadNpmTasks('grunt-contrib-compress');

   // register a few tasks
   grunt.registerTask('build', ['sass:all', 'uglify:clientSideJs', 'cssmin:minifyCss']);
   grunt.registerTask('start-dev', ['develop:server', 'sass:all', 'watch:sources']);
   grunt.registerTask('test', ['serversideJasmine']);
};
