module.exports = {
  extends: 'anf',
  rules: {
    'flowtype/require-valid-file-annotation': 0,
  },
  globals: {
    __SERVER__: true,
    "fetch":false,
  }
};
