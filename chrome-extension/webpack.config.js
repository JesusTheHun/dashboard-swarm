// Conf
const buildDirectory = 'build';

// Common imports

const path = require('path');

// Plugins
const CleanWebpackPlugin = require('clean-webpack-plugin');

/////////
// Run //
/////////

module.exports = {
    entry: {
        background: './src/background.js',
        config: './src/config.js',
        popup: './src/popup.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, buildDirectory),
    },
    plugins: [
        new CleanWebpackPlugin([buildDirectory])
    ],
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['env']
                }
            }
        }]
    },
    watchOptions: {
        aggregateTimeout: 300
    },
    stats: {
        warnings: false
    },
    devtool: 'source-map'
};