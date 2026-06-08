const appJson = require('./app.json');

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    ios: {
      ...(appJson.expo.ios ?? {}),
      bundleIdentifier: 'com.roundpay.ajoesusu',
      usesAppleSignIn: true,
      infoPlist: {
        ...(appJson.expo.ios?.infoPlist ?? {}),
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      ...(appJson.expo.android ?? {}),
      package: 'com.roundpay.ajoesusu',
      intentFilters: [
        {
          action: 'VIEW',
          data: [{ scheme: 'ajoesusu' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    plugins: [
      ...(appJson.expo.plugins ?? []),
      [
        'expo-local-authentication',
        {
          faceIDPermission:
            'Allow RoundPay to use Face ID to unlock the app when you return from the background.',
        },
      ],
      'expo-secure-store',
      [
        'expo-image-picker',
        {
          photosPermission:
            'Allow RoundPay to access your photos so you can set a profile picture.',
          cameraPermission:
            'Allow RoundPay to use your camera so you can take a profile picture.',
        },
      ],
    ],
    extra: {
      ...(appJson.expo.extra ?? {}),
      eas: {
        ...(appJson.expo.extra?.eas ?? {}),
        projectId:
          process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
          appJson.expo.extra?.eas?.projectId ??
          'ce4392f3-0966-42fe-b826-a8eeaa9625dc',
      },
    },
  },
};
