/* webpack.config.js */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
//const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  // Tell webpack to begin building its
  // dependency graph from this file.
  entry: path.join(__dirname, 'src', 'js', 'App.js'),
  // And to place the output in the `build` directory
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js'
  },
  resolve: {
    alias: {
      Styles: path.resolve(__dirname, 'src/styles'),
      Asset: path.resolve(__dirname, 'src/assets'),
    }
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        /* We'll leave npm packages as is and not
           parse them with Babel since most of them
           are already pre-transpiled anyway. */
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.(jpe?g|png|gif)$/,
        exclude: /node_modules/,
        use: [{
          /* inline if smaller than 10 KB, otherwise load as a file */
          loader: 'url-loader',
          options: {
            limit: 10000
          }
        }]
      },
      {
        test: /\.(eot|svg|ttf|woff2?|otf)$/,
        exclude: /node_modules/,
        use: 'file-loader'
      }
    ]
  },
  plugins: [
    //new CleanWebpackPlugin(['public']),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'public', 'index.html')
    })
  ]
}
