const path = require('path');

module.exports = {
    entry: {
        background: './src/background.js',
        config: './src/config.js',
        popup: './src/popup.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'build'),
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env']
                    }
                }
            }
        ]
    },
    watchOptions: {
        aggregateTimeout: 300
    },
    stats: {
        warnings: false
    }
};