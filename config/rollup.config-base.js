const postcss = require('rollup-plugin-postcss');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const babel = require('rollup-plugin-babel');
const replace = require('rollup-plugin-replace');
const terser = require('rollup-plugin-terser').terser;
const precss = require('precss');
const json = require('rollup-plugin-json');

module.exports = function (release) {
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
    json(),
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
          'createFactory',
          'isValidElement'
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
        ],
        'node_modules/recharts-scale/es6/index.js': [
          'getTickValues',
          'getNiceTickValues',
          'getTickValuesFixedDomain'
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
    json(),
    commonjs({
      ignore: [],
    }),
    nodeResolve()
  ];

  if (release) {
    clientPlugins.push(terser());
  }

  const onwarn = warning => {
    // Silence circular dependency warning for d3
    if (warning.code === 'CIRCULAR_DEPENDENCY' && !warning.importer.indexOf('node_modules/d3')) {
      return
    }

    console.warn(`(!) ${warning.message}`);
  };

  const ret = [{
    input: 'app/index.js',
    output: {
      file: 'public/app.js',
      format: 'iife',
      name: 'app',
      sourcemap: !release
    },
    onwarn,
    plugins: clientPlugins
  }];

  ret.push({
    input: 'server/server.js',
    output: {
      file: 'public/server.js',
      format: 'cjs',
      sourcemap: !release
    },
    plugins: serverPlugins,
  });

  return ret;
};
