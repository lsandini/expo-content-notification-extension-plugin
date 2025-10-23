const {
    withDangerousMod,
    withXcodeProject,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');
const {
    IPHONEOS_DEPLOYMENT_TARGET,
    TARGETED_DEVICE_FAMILY,
    GROUP_IDENTIFIER_TEMPLATE_REGEX,
    BUNDLE_SHORT_VERSION_TEMPLATE_REGEX,
    BUNDLE_VERSION_TEMPLATE_REGEX,
    CATEGORY_IDENTIFIER_TEMPLATE_REGEX,
    CONTENT_SIZE_RATIO_TEMPLATE_REGEX,
    DEFAULT_BUNDLE_VERSION,
    DEFAULT_BUNDLE_SHORT_VERSION,
    DEFAULT_CATEGORY_IDENTIFIER,
    DEFAULT_CONTENT_SIZE_RATIO,
    NCE_TARGET_NAME,
    NCE_SOURCE_FILES,
    NCE_RESOURCE_FILES,
    NCE_EXT_FILES
} = require('./constants');
const {
    copyFile,
    replaceInFile,
    getEasManagedCredentialsConfigExtra
} = require('./utils');

/**
 * Copy extension files and configure them
 */
const withContentExtensionFiles = (config, props) => {
    return withDangerousMod(config, [
        'ios',
        async (config) => {
            const iosPath = path.join(config.modRequest.projectRoot, "ios");
            const pluginDir = path.join(__dirname, 'ios');
            const extensionPath = path.join(iosPath, NCE_TARGET_NAME);

            // Create extension directory
            if (!fs.existsSync(extensionPath)) {
                fs.mkdirSync(extensionPath, { recursive: true });
            }

            // Copy source files
            for (const file of NCE_SOURCE_FILES) {
                const sourcePath = path.join(pluginDir, file);
                const targetPath = path.join(extensionPath, file);
                await copyFile(sourcePath, targetPath);
            }

            // Copy resource files
            for (const file of NCE_RESOURCE_FILES) {
                const sourcePath = path.join(pluginDir, file);
                const targetPath = path.join(extensionPath, file);
                await copyFile(sourcePath, targetPath);
            }

            // Copy extension configuration files
            for (const file of NCE_EXT_FILES) {
                const sourcePath = path.join(pluginDir, file);
                const targetPath = path.join(extensionPath, file);
                await copyFile(sourcePath, targetPath);
            }

            // Remove entitlements file if it exists (not required for this extension)
            const entitlementsPath = path.join(extensionPath, `${NCE_TARGET_NAME}.entitlements`);
            if (fs.existsSync(entitlementsPath)) {
                fs.unlinkSync(entitlementsPath);
            }

            // Replace placeholders in Info.plist
            const infoPlistPath = path.join(extensionPath, `${NCE_TARGET_NAME}-Info.plist`);
            await replaceInFile(infoPlistPath, [
                [BUNDLE_SHORT_VERSION_TEMPLATE_REGEX, config.version || DEFAULT_BUNDLE_SHORT_VERSION],
                [BUNDLE_VERSION_TEMPLATE_REGEX, config.ios?.buildNumber || DEFAULT_BUNDLE_VERSION],
                [CATEGORY_IDENTIFIER_TEMPLATE_REGEX, props.categoryIdentifier || DEFAULT_CATEGORY_IDENTIFIER],
                [CONTENT_SIZE_RATIO_TEMPLATE_REGEX, String(props.contentSizeRatio || DEFAULT_CONTENT_SIZE_RATIO)]
            ]);

            return config;
        },
    ]);
};

/**
 * Configure Xcode project with the new extension target
 */
const withContentExtensionXcodeProject = (config, props) => {
    return withXcodeProject(config, newConfig => {
        const xcodeProject = newConfig.modResults;

        // Check if target already exists
        if (!!xcodeProject.pbxTargetByName(NCE_TARGET_NAME)) {
            console.log(`${NCE_TARGET_NAME} already exists in project. Skipping...`);
            return newConfig;
        }

        // Create new PBXGroup for the extension
        const allFiles = [...NCE_SOURCE_FILES, ...NCE_RESOURCE_FILES, ...NCE_EXT_FILES];
        const extGroup = xcodeProject.addPbxGroup(allFiles, NCE_TARGET_NAME, NCE_TARGET_NAME);

        // Set correct storyboard file type for compilation
        const pbxFileReferences = xcodeProject.hash.project.objects['PBXFileReference'];
        Object.keys(pbxFileReferences).forEach(function (key) {
            const fileRef = pbxFileReferences[key];
            if (fileRef && typeof fileRef === 'object') {
                const fileName = fileRef.name || fileRef.path || '';
                const normalizedName = fileName.replace(/["']/g, '');
                if (normalizedName === 'MainInterface.storyboard') {
                    fileRef.lastKnownFileType = 'file.storyboard';
                    fileRef.includeInIndex = 0;
                    delete fileRef.explicitFileType;
                }
            }
        });

        // Add the new PBXGroup to the top level group
        const groups = xcodeProject.hash.project.objects["PBXGroup"];
        Object.keys(groups).forEach(function (key) {
            if (typeof groups[key] === "object" && groups[key].name === undefined && groups[key].path === undefined) {
                xcodeProject.addToPbxGroup(extGroup.uuid, key);
            }
        });

        // Initialize required Xcode project objects
        const projObjects = xcodeProject.hash.project.objects;
        projObjects['PBXTargetDependency'] = projObjects['PBXTargetDependency'] || {};
        projObjects['PBXContainerItemProxy'] = projObjects['PBXContainerItemProxy'] || {};

        // Add the NCE target
        const nceTarget = xcodeProject.addTarget(
            NCE_TARGET_NAME,
            "app_extension",
            NCE_TARGET_NAME,
            `${config.ios?.bundleIdentifier}.${NCE_TARGET_NAME}`
        );

        // Add build phases
        xcodeProject.addBuildPhase(
            ["NotificationViewController.m"],
            "PBXSourcesBuildPhase",
            "Sources",
            nceTarget.uuid
        );

        xcodeProject.addBuildPhase(
            ["MainInterface.storyboard"],
            "PBXResourcesBuildPhase",
            "Resources",
            nceTarget.uuid
        );

        // Add UserNotifications and UserNotificationsUI frameworks
        const frameworksBuildPhase = xcodeProject.addBuildPhase(
            [],
            "PBXFrameworksBuildPhase",
            "Frameworks",
            nceTarget.uuid
        );

        // Add required frameworks for notification content extension
        const userNotificationsFramework = xcodeProject.addFramework('UserNotifications.framework', {
            target: nceTarget.uuid,
            link: true
        });
        const userNotificationsUIFramework = xcodeProject.addFramework('UserNotificationsUI.framework', {
            target: nceTarget.uuid,
            link: true
        });

        // Configure build settings
        const configurations = xcodeProject.pbxXCBuildConfigurationSection();
        for (const key in configurations) {
            if (typeof configurations[key].buildSettings !== "undefined" &&
                configurations[key].buildSettings.PRODUCT_NAME == `"${NCE_TARGET_NAME}"`) {

                const buildSettingsObj = configurations[key].buildSettings;
                if (props?.devTeam && props.devTeam !== 'undefined') {
                    buildSettingsObj.DEVELOPMENT_TEAM = props.devTeam;
                }
                buildSettingsObj.IPHONEOS_DEPLOYMENT_TARGET = props?.iPhoneDeploymentTarget || IPHONEOS_DEPLOYMENT_TARGET;
                buildSettingsObj.TARGETED_DEVICE_FAMILY = TARGETED_DEVICE_FAMILY;
                buildSettingsObj.CODE_SIGN_STYLE = "Automatic";
            }
        }

        // Add development teams only if explicitly provided
        if (props?.devTeam && props.devTeam !== 'undefined') {
            xcodeProject.addTargetAttribute("DevelopmentTeam", props.devTeam, nceTarget);
            xcodeProject.addTargetAttribute("DevelopmentTeam", props.devTeam);
        }

        return newConfig;
    });
};

/**
 * Configure EAS managed credentials
 */
const withEasManagedCredentials = (config) => {
    if (!config.ios?.bundleIdentifier) {
        throw new Error("Missing 'ios.bundleIdentifier' in app config.");
    }

    config.extra = getEasManagedCredentialsConfigExtra(config);
    return config;
};

/**
 * Main plugin export
 */
const withContentExtension = (config, props = {}) => {
    // Validate required props
    if (!props.mode) {
        throw new Error(`
        Missing required "mode" key in your app.json or app.config.js file for "expo-notification-content-extension-plugin".
        "mode" can be either "development" or "production".
        `);
    }

    // Apply all modifications
    config = withContentExtensionFiles(config, props);
    config = withContentExtensionXcodeProject(config, props);
    config = withEasManagedCredentials(config);

    return config;
};

module.exports = withContentExtension;