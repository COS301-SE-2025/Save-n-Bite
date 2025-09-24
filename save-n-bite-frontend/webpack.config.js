module.exports = {
  module: {
    rules: [
      {
        test: /\.riv$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/rive/[name][ext]'
        }
      }
    ]
  }
};