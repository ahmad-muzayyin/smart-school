const { withAppBuildGradle } = require('expo/config-plugins');

const withAndroidAgpFix = (config) => {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            const contents = config.modResults.contents;

            // Check if the fix is already applied to avoid duplication
            if (contents.includes('kindlyAcceptAnyAgpVersion')) {
                return config;
            }

            const fixBlock = `
// Fix for AGP 8.x attribute mismatch with React Native libraries
android {
    configurations.all {
         resolutionStrategy {
            force "com.facebook.react:react-android:0.81.5"
         }
    }
}

dependencies {
    attributesSchema {
        attribute(Attribute.of("com.android.build.api.attributes.AgpVersionAttr", String)) {
            compatibilityRules.add(kindlyAcceptAnyAgpVersion)
        }
    }
}

class kindlyAcceptAnyAgpVersion implements AttributeCompatibilityRule<String> {
    @Override
    void execute(CompatibilityCheckDetails<String> details) {
        // Accept any AGP version from the producer (library) to match the consumer (app)
        details.compatible()
    }
}
`;
            config.modResults.contents = contents + fixBlock;
        }
        return config;
    });
};

module.exports = withAndroidAgpFix;
