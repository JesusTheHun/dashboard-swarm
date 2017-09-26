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
    'config.html',
    'build/background.js',
    'build/config.js',
    'build/popup.js',
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
                fs.mkdirSync(dest + '/' + dirTower.join('/') + dir);
            } catch (err) {
                dirTower.push(dir);

                if (err.code !== 'EEXIST') {
                    console.error(err);
                }
            }
        });

        fs.copyFile(filepath, dest + '/' + filepath, err => {
            if (err) {
                console.log("Failed to copy file : " + filepath);
                return;
            }

            console.log("Successfully copied file : " + filepath);
        });
    });

    console.log("Dist build is available at " + dest + "/");
});

