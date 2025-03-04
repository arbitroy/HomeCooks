// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*'],
  settings: {
    'import/resolver': {
      typescript: {},
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        paths: ['./']
      },
      alias: {
        map: [
          ['@', './']
        ],
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    }
  }
};