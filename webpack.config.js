const path = require('path');

module.exports = {
  mode: "development",
  optimization: {
    minimize: false
  },
  devtool: 'source-map',
  devServer: {
    contentBase: './ackbas_core'
  },
  entry: './ackbas_core/ts/index.ts',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'ackbas_core', 'static', 'ackbas_core'),
    publicPath: "/static/ackbas_core/",
    library: 'ackbas'
  },
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ["*", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      { test: /\.tsx?$/, loader: "awesome-typescript-loader" },

      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { test: /\.js$/, loader: "source-map-loader" }
    ]
  }
};