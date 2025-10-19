const fs = require('fs');
const path = require('path');

/**
 * Copy a file from source to destination
 */
async function copyFile(source, destination) {
    return new Promise((resolve, reject) => {
        fs.copyFile(source, destination, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Read a file and return its contents
 */
async function readFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * Write content to a file
 */
async function writeFile(filePath, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, content, 'utf8', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Replace template placeholders in a file
 */
async function replaceInFile(filePath, replacements) {
    let content = await readFile(filePath);

    for (const [pattern, value] of replacements) {
        content = content.replace(pattern, value);
    }

    await writeFile(filePath, content);
}

/**
 * Get EAS managed credentials configuration
 */
function getEasManagedCredentialsConfigExtra(config) {
    const bundleIdentifier = config.ios?.bundleIdentifier;
    if (!bundleIdentifier) {
        throw new Error("Missing 'ios.bundleIdentifier' in app config.");
    }

    const existingExtra = config.extra || {};

    return {
        ...existingExtra,
        eas: {
            ...existingExtra.eas,
            build: {
                ...existingExtra.eas?.build,
                experimental: {
                    ...existingExtra.eas?.build?.experimental,
                    ios: {
                        ...existingExtra.eas?.build?.experimental?.ios,
                        appExtensions: [
                            ...(existingExtra.eas?.build?.experimental?.ios?.appExtensions || []),
                            {
                                targetName: 'NotificationContentExtension',
                                bundleIdentifier: `${bundleIdentifier}.NotificationContentExtension`,
                            },
                        ],
                    },
                },
            },
        },
    };
}

module.exports = {
    copyFile,
    readFile,
    writeFile,
    replaceInFile,
    getEasManagedCredentialsConfigExtra
};
