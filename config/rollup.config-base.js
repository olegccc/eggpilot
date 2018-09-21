const postcss = require('rollup-plugin-postcss');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const babel = require('rollup-plugin-babel');
const replace = require('rollup-plugin-replace');
const terser = require('rollup-plugin-terser').terser;
const precss = require('precss');

module.exports = function(release) {
  const clientPlugins = [
    babel({
      include: [
          'app/components/**/*.js',
          'app/actions/**/*.js',
          'app/index.js'
      ],
      babelrc: false,
      presets: [
        'react',
        [
          'env',
          {
            modules: false,
            targets: {
              browsers: ["last 2 versions"]
            }
          }
        ]
      ],
      plugins: [
        'external-helpers',
        'transform-class-properties'
      ]
    }),
    nodeResolve({
      jsnext: true,
      main: true
    }),
    commonjs({
      include: ['node_modules/**'],
      namedExports: {
        'node_modules/@material-ui/core/styles/index.js': [
          'createGenerateClassName',
          'createMuiTheme',
          'jssPreset',
          'MuiThemeProvider',
          'createStyles',
          'withStyles',
          'withTheme'
        ],
        'node_modules/@material-ui/core/Modal/index.js': [
          'ModalManager'
        ],
        'node_modules/react/index.js': [
          'Children',
          'createRef',
          'Component',
          'PureComponent',
          'createContext',
          'forwardRef',
          'Fragment',
          'StrictMode',
          'createElement',
          'cloneElement',
          'createFactory'
        ],
        'node_modules/prop-types/index.js': [
            'array',
            'bool',
            'func',
            'number',
            'object',
            'string',
            'symbol',
            'any',
            'arrayOf',
            'element',
            'instanceOf',
            'node',
            'objectOf',
            'oneOf',
            'oneOfType',
            'shape',
            'exact'
        ],
        'node_modules/immutable/dist/immutable.js': [
          'Map'
        ]
      }
    }),
    postcss({
      modules: true,
      plugins: [
          precss()
      ]
    }),
    replace({
      'process.env.NODE_ENV': release ? "'production'" : "'development'"
    })
  ];

  const serverPlugins = [
    commonjs({
      ignore: []
    }),
    nodeResolve()
  ];

  if (release) {
    clientPlugins.push(terser());
  }

  const ret = [{
      input: 'app/index.js',
      output: {
          file: 'public/app.js',
          format: 'iife',
          name: 'app',
          sourcemap: !release
      },
      plugins: clientPlugins
  }];

  if (!release) {
    ret.push({
        input: 'server/index.js',
        output: {
            file: 'public/server.js',
            format: 'cjs',
            sourcemap: true
        },
        plugins: serverPlugins,
    });
  }

  return ret;
};
