const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withReanimatedFix(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      
      // Fix 1: CMakeLists.txt - Remove -Werror
      const cmakePath = path.join(
        projectRoot,
        'node_modules/react-native-reanimated/android/CMakeLists.txt'
      );
      
      if (fs.existsSync(cmakePath)) {
        let cmake = fs.readFileSync(cmakePath, 'utf8');
        cmake = cmake.replace(
          '-Wall -Werror")',
          '-Wall")'
        );
        fs.writeFileSync(cmakePath, cmake);
        console.log('✅ Fixed CMakeLists.txt');
      }
      
      // Fix 2: ReanimatedPackage.java - Remove Systrace
      const packagePath = path.join(
        projectRoot,
        'node_modules/react-native-reanimated/android/src/main/java/com/swmansion/reanimated/ReanimatedPackage.java'
      );
      
      if (fs.existsSync(packagePath)) {
        let code = fs.readFileSync(packagePath, 'utf8');
        
        // Remove import
        code = code.replace(
          'import com.facebook.systrace.Systrace;\n',
          '// import com.facebook.systrace.Systrace; // Removed for RN 0.81+\n'
        );
        
        // Remove beginSection
        code = code.replace(
          /Systrace\.beginSection\(Systrace\.TRACE_TAG_REACT_JAVA_BRIDGE,\s*"createUIManagerModule"\);/g,
          '// Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "createUIManagerModule");'
        );
        
        // Remove endSection
        code = code.replace(
          /Systrace\.endSection\(Systrace\.TRACE_TAG_REACT_JAVA_BRIDGE\);/g,
          '// Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);'
        );
        
        fs.writeFileSync(packagePath, code);
        console.log('✅ Fixed ReanimatedPackage.java');
      }
      
      // Fix 3: BorderRadiiDrawableUtils.java - Fix resolve method
      const borderPath = path.join(
        projectRoot,
        'node_modules/react-native-reanimated/android/src/reactNativeVersionPatch/BorderRadiiDrawableUtils/latest/com/swmansion/reanimated/BorderRadiiDrawableUtils.java'
      );
      
      if (fs.existsSync(borderPath)) {
        let code = fs.readFileSync(borderPath, 'utf8');
        code = code.replace(
          'length.resolve(bounds.width(), bounds.height())',
          'length.resolve((float) bounds.width())'
        );
        fs.writeFileSync(borderPath, code);
        console.log('✅ Fixed BorderRadiiDrawableUtils.java');
      }
      
      return config;
    },
  ]);
};
