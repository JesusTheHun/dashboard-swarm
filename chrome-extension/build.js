const fs = require('fs');

let dest = process.argv[2] !== undefined ? process.argv[2] : 'dist';

// Remove trailing slash
if (dest.substring(0, -1) === '/') {
    dest = dest.substring(0, -1);
}

let buildComponents = [
    'manifest.json',
    'icon.png',
    'popup.html',
    'popup.css',
    'node_modules/spectre.css/dist/spectre.min.css',
    'node_modules/spectre.css/dist/spectre-icons.min.css',
    'node_modules/font-awesome/css/font-awesome.min.css',
    'node_modules/font-awesome/fonts/FontAwesome.otf',
    'node_modules/font-awesome/fonts/fontawesome-webfont.eot',
    'node_modules/font-awesome/fonts/fontawesome-webfont.svg',
    'node_modules/font-awesome/fonts/fontawesome-webfont.ttf',
    'node_modules/font-awesome/fonts/fontawesome-webfont.woff',
    'node_modules/font-awesome/fonts/fontawesome-webfont.woff2',
    'config.html',
    'build/background.js',
    'build/config.js',
    'build/popup.js',
    'build/contentScript.js',
];

fs.mkdir(dest, err => {
    if (err && err.code !== 'EEXIST') {
        console.error(err);
    }

    buildComponents.map(filepath => {

        // Remove heading slash
        if (filepath.substring(0, 1) === '/') {
            filepath = filepath.substring(1);
        }

        try {
            fs.accessSync(filepath);
        } catch (err) {
            console.error("cant access file : " + filepath);
        }

        let dirHierarchy = filepath.split('/');
        let dirTower = [];

        dirHierarchy.forEach((dir, index) => {
            if (dirHierarchy.length === 1 || (index === dirHierarchy.length - 1)) {
                return;
            }

            try {
                fs.mkdirSync(dest + '/' + dirTower.join('/') + '/' + dir);
            } catch (err) {
                if (err.code !== 'EEXIST') {
                    console.error(err);
                }
            } finally {
                dirTower.push(dir);
            }
        });

        fs.copyFile(filepath, dest + '/' + filepath, err => {
            if (err) {
                console.log("Failed to copy file : " + filepath);
                console.log(err);
                return;
            }

            console.log("Successfully copied file : " + filepath);
        });
    });

    console.log("Dist build is available at " + dest + "/");
});

