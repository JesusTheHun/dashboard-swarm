// Conf
const buildDirectory = 'build';

// Common imports

const path = require('path');

// Plugins
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

/////////
// Run //
/////////

module.exports = {
    context: path.join(__dirname, 'src'),
    entry: {
        background: './background.js',
        config: './config.js',
        popup: './popup.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, buildDirectory),
    },
    plugins: [
        new CleanWebpackPlugin([buildDirectory]),
        new CopyWebpackPlugin([
            {from: 'content_script/**/*', to: 'content_script/[name].[ext]'}
        ])
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