const path = require('path');

module.exports = {
  resolve: {
    alias: {
      // Resuelve advertencias relacionadas con CommonJS en las dependencias
      'core-js/modules/es.array.index-of': 'core-js-pure/features/array/index-of',
      'core-js/modules/es.array.iterator': 'core-js-pure/features/array/iterator',
      'core-js/modules/es.array.reduce': 'core-js-pure/features/array/reduce',
      'core-js/modules/es.promise': 'core-js-pure/features/promise',
      'core-js/modules/es.regexp.to-string': 'core-js-pure/features/regexp/to-string',
      'core-js/modules/es.string.ends-with': 'core-js-pure/features/string/ends-with',
      'core-js/modules/es.string.includes': 'core-js-pure/features/string/includes',
      'core-js/modules/es.string.match': 'core-js-pure/features/string/match',
      'core-js/modules/es.string.replace': 'core-js-pure/features/string/replace',
    },
    extensions: ['.js', '.ts', '.json'],
  },
};
