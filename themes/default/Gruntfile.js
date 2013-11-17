/*
 * Setup options for grunt to work with.
 */
module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		uglify: {
			lib: {
				options: {
					preserveComments: 'some',
					mangle: true,
					compress: true,
					beautify: false
				},
				files: {
					'javascript/lib.js': [
						'src/javascript/lib/jquery/jquery-2.0.3.js',
						'src/javascript/lib/jquery-autocomplete/dist/jquery.autocomplete.js',
						'src/javascript/lib/d3/d3.v3/d3.v3.js',
						'src/javascript/lib/snap/dist/snap.svg.js',
						'src/javascript/lib/svgicons.js'
					]
				}
			},
			app: {
				options: {
					preserveComments: 'some',
					mangle: false,
					compress: false,
					beautify: true
				},
				files: {
					'javascript/app.js': [
						'../../persona/javascript/frontend.js',
						'src/javascript/svgicons-config.js',
						'src/javascript/menu.js',
						'src/javascript/search.js',
						'src/javascript/main.js'
					]
				}
			},
		},
		compass: {
			production: {
				options: {
					sassDir: 'src/scss',
					cssDir: 'css',
					environment: 'production'
				}
			},
			dev: {
				options: {
					sassDir: 'src/scss',
					cssDir: 'styleguide',
					outputStyle: 'nested',
					noLineComments: true
				}
			}
		},
		jshint: {
			app: ['Gruntfile.js', 'src/javascript/*.js']
		},
		watch: {
			scriptsLibrary: {
				files: ['src/javascript/lib/**/*.js'],
				tasks: ['jshint:lib', 'uglify:lib']
			},
			scriptsProject: {
			files: ['src/javascript/*.js'],
				tasks: ['jshint:app', 'uglify:app']
			},
			styles: {
				files: ['src/scss/*.scss', 'src/scss/**/*.scss'],
				tasks: 'compass'
			}
		}
	});
	
	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jshint');

};
