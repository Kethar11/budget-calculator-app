# Android APK Build Instructions

This guide will help you build an Android APK for the Budget Calculator app that syncs with your Google Sheet.

## Your Google Sheet Configuration

**Sheet ID:** `1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0`  
**Sheet URL:** https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit?usp=sharing

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Android Studio** with Android SDK
3. **Java JDK** (11 or higher)
4. **React Native CLI** or **Capacitor** (for mobile app)

## Option 1: Using Capacitor (Recommended - Easier)

### Step 1: Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
npx cap init
```

When prompted:
- **App name:** Budget Calculator
- **App ID:** com.budgetcalculator.app
- **Web dir:** build

### Step 2: Add Android Platform

```bash
npx cap add android
```

### Step 3: Configure Android

1. Open `android/app/src/main/AndroidManifest.xml`
2. Add internet permission:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

3. Update `android/app/build.gradle`:
```gradle
android {
    compileSdkVersion 33
    defaultConfig {
        applicationId "com.budgetcalculator.app"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
    }
}
```

### Step 4: Configure Google Sheets API

1. Create a file `android/app/src/main/assets/google_sheet_id.txt`:
```
1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0
```

2. Or set it in `android/app/src/main/res/values/strings.xml`:
```xml
<resources>
    <string name="google_sheet_id">1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0</string>
</resources>
```

### Step 5: Build APK

```bash
# Build React app
npm run build

# Sync with Capacitor
npx cap sync

# Open Android Studio
npx cap open android
```

In Android Studio:
1. Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**
2. Wait for build to complete
3. APK will be in `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 6: Generate Signed APK (for production)

1. In Android Studio: **Build** > **Generate Signed Bundle / APK**
2. Create a keystore (or use existing)
3. Select **APK**
4. Choose release build variant
5. APK will be in `android/app/build/outputs/apk/release/app-release.apk`

## Option 2: Using React Native (Alternative)

### Step 1: Initialize React Native

```bash
npx react-native init BudgetCalculatorApp
cd BudgetCalculatorApp
```

### Step 2: Copy Your React Code

Copy your `src` folder and other necessary files to the React Native project.

### Step 3: Install Dependencies

```bash
npm install
npm install react-native-webview
npm install @react-native-async-storage/async-storage
```

### Step 4: Configure Android

Update `android/app/src/main/AndroidManifest.xml` with internet permissions.

### Step 5: Build APK

```bash
cd android
./gradlew assembleRelease
```

APK will be in `android/app/build/outputs/apk/release/app-release.apk`

## Option 3: Using PWA (Progressive Web App) - No APK Needed

Since your app is a web app, you can also install it as a PWA on Android:

1. Open the app in Chrome on Android
2. Tap the menu (3 dots)
3. Select "Add to Home Screen"
4. The app will work like a native app

## Backend Configuration for Google Sheets

### Step 1: Set Environment Variables

Create `.env` file in `backend/`:

```env
GOOGLE_SHEET_ID=1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0
GOOGLE_CREDENTIALS_FILE=credentials.json
```

### Step 2: Google Sheets API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google Sheets API** and **Google Drive API**
4. Create a **Service Account**
5. Download the JSON credentials file
6. Save it as `backend/credentials.json`
7. Share your Google Sheet with the service account email (found in credentials.json)

### Step 3: Make Sheet Public (Optional)

Since you mentioned the sheet is public:
1. Open your Google Sheet
2. Click **Share** button
3. Set to **"Anyone with the link can edit"**

## Testing the APK

1. Enable **Developer Options** on your Android device
2. Enable **USB Debugging**
3. Connect device via USB
4. Install APK:
```bash
adb install app-release.apk
```

Or transfer APK to device and install manually.

## Features in APK

✅ **No Login Required** - Works offline with local storage  
✅ **Auto-sync with Google Sheets** - Fetches latest data on app open  
✅ **Daily Sync** - Automatically syncs once per day  
✅ **Bidirectional Sync** - Changes sync to Google Sheets  
✅ **PDF Upload** - Upload PDFs that sync to Google Sheets  
✅ **Works Offline** - All data stored locally in IndexedDB  

## Troubleshooting

### APK won't install
- Check if "Install from Unknown Sources" is enabled
- Verify minimum SDK version matches your device

### Google Sheets sync not working
- Check internet connection
- Verify Google Sheet ID is correct
- Check backend is running and accessible
- Verify service account has access to the sheet

### App crashes on startup
- Check Android logs: `adb logcat`
- Verify all permissions are granted
- Check if backend URL is accessible from device

## Production Build Tips

1. **Obfuscate code:** Enable ProGuard in `android/app/build.gradle`
2. **Optimize images:** Compress all images
3. **Minify JavaScript:** Already done in React build
4. **Test on multiple devices:** Different screen sizes and Android versions
5. **Update version:** Increment versionCode in build.gradle

## Distribution

1. **Google Play Store:** Upload signed APK to Play Console
2. **Direct Distribution:** Share APK file directly
3. **Firebase App Distribution:** Use Firebase for beta testing

## Support

If you encounter issues:
1. Check Android Studio logs
2. Check device logs: `adb logcat`
3. Verify backend is running: `http://your-backend-url:8000`
4. Test Google Sheets API access

