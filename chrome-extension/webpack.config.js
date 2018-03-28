// Conf
const buildDirectory = 'build';

// Common imports

const path = require('path');

// Plugins
const CopyWebpackPlugin = require('copy-webpack-plugin');

/////////
// Run //
/////////

module.exports = {
    context: __dirname,
    entry: {
        background: './background.js',
        contentScript: './contentScript.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, buildDirectory),
    },
    plugins: [
        new CopyWebpackPlugin([
            {from: 'env.dev.js', to: 'env.js'},
            {from: 'contentScript.css', to: './[name].[ext]'}
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