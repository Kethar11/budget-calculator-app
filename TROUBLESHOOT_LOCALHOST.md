# Troubleshooting: localhost:3000 Not Working

## ✅ Server Status
The React dev server is **running** and responding on port 3000.

## Quick Fixes

### 1. Wait for Compilation
The server might still be compiling. Wait 30-60 seconds and refresh your browser.

### 2. Check Browser Console
Open your browser's Developer Tools (F12 or Cmd+Option+I on Mac):
- Go to **Console** tab
- Look for any **red error messages**
- Share the error message if you see one

### 3. Hard Refresh
Try a hard refresh:
- **Mac:** Cmd + Shift + R
- **Windows/Linux:** Ctrl + Shift + R

### 4. Clear Browser Cache
1. Open Developer Tools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### 5. Check URL
Make sure you're accessing:
```
http://localhost:3000
```
NOT:
- `https://localhost:3000` (wrong protocol)
- `http://127.0.0.1:3000` (might work, but try localhost first)

### 6. Check Terminal Output
Look at the terminal where `npm start` is running:
- Do you see "Compiled successfully!"?
- Or do you see any error messages?

### 7. Restart Server
If nothing works, restart the server:

```bash
# Stop the server (Ctrl+C in terminal)
# Then restart:
npm start
```

## Common Errors

### "Cannot GET /"
- **Fix:** Make sure you're going to `http://localhost:3000` (not just port 3000)

### "EADDRINUSE: address already in use"
- **Fix:** Another process is using port 3000
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Then restart:
npm start
```

### "Module not found"
- **Fix:** Reinstall dependencies
```bash
rm -rf node_modules
npm install
npm start
```

### White Screen / Blank Page
- **Fix:** Check browser console for JavaScript errors
- Check if `bundle.js` is loading (Network tab in DevTools)

### "Failed to compile"
- **Fix:** Check terminal for compilation errors
- Fix any syntax errors shown

## Still Not Working?

1. **Check if server is actually running:**
   ```bash
   curl http://localhost:3000
   ```
   Should return HTML.

2. **Check port:**
   ```bash
   lsof -i:3000
   ```
   Should show node process.

3. **Try different browser:**
   - Chrome
   - Firefox
   - Safari

4. **Check firewall:**
   - Make sure localhost:3000 is not blocked

## Get Help

If still not working, please share:
1. Browser console errors (F12 → Console tab)
2. Terminal output from `npm start`
3. What you see in the browser (blank page? error message?)

