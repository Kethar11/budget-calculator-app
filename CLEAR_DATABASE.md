# Fix Database Error

If you're seeing the error: "One of the specified object stores was not found"

## Quick Fix:

1. **Open Browser Developer Tools** (F12 or Cmd+Option+I on Mac)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Find **IndexedDB** in the left sidebar
4. Find **FinancialCalculatorDB**
5. **Right-click** and select **Delete** or **Clear**
6. **Refresh the page** (F5 or Cmd+R)

The database will be recreated with the new schema automatically.

## Alternative: Clear All Site Data

1. Open Browser Settings
2. Go to Privacy/Security
3. Clear browsing data
4. Select "Cached images and files" and "Site data"
5. Clear data for localhost:3000

After clearing, refresh the page and the app will work correctly!




