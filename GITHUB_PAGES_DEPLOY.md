# Deploy to GitHub Pages - Simple Guide

## Quick Deploy (5 minutes)

### Step 1: Install gh-pages
```bash
npm install --save-dev gh-pages
```

### Step 2: Deploy
```bash
npm run deploy
```

That's it! Your app will be live at:
**https://Kethar11.github.io/budget-calculator-app**

---

## Login Credentials

- **Username:** `jasper`
- **Password:** `780788`

---

## What's Included

✅ **Simple Login** - Username/Password authentication  
✅ **Excel Sync** - Fetch/Update/Clear buttons (simplified)  
✅ **No Backend Required** - Works with IndexedDB (local storage)  
✅ **Mobile Responsive** - Works on phones and tablets  
✅ **All Features** - Budget, Savings, Expenses calculators  

---

## Manual Deployment

If `npm run deploy` doesn't work:

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Deploy:**
   ```bash
   npx gh-pages -d build
   ```

4. **Wait 1-2 minutes**, then visit:
   ```
   https://Kethar11.github.io/budget-calculator-app
   ```

---

## Update After Changes

Every time you make changes:

```bash
npm run deploy
```

Wait 1-2 minutes for GitHub Pages to update.

---

## Troubleshooting

### "gh-pages not found"
```bash
npm install --save-dev gh-pages
```

### "Build failed"
```bash
npm run build
# Check for errors, fix them, then:
npm run deploy
```

### "Page not found"
- Wait 2-3 minutes (GitHub Pages takes time to deploy)
- Check repository settings:
  - Go to Settings → Pages
  - Source: `gh-pages` branch
  - Folder: `/ (root)`

### "Login not working"
- Make sure you're using:
  - Username: `jasper`
  - Password: `780788`

---

## Features Available

- ✅ Budget Calculator (Income/Expense tracking)
- ✅ Savings Calculator (Deposits tracking)
- ✅ Expense Calculator (Detailed expenses)
- ✅ File Upload (PDF attachments)
- ✅ Charts & Graphs
- ✅ Date Range Filtering
- ✅ Category Filtering
- ✅ Search Functionality
- ✅ Bulk Delete
- ✅ Excel Sync (Fetch/Update/Clear)

---

## Notes

- **No Backend Required** - All data stored locally in browser (IndexedDB)
- **Excel Sync** - Only works if you have backend running (optional)
- **Login** - Simple username/password (stored in localStorage)
- **Mobile Friendly** - Works on all devices

---

## Support

If you have issues:
1. Check browser console (F12) for errors
2. Clear browser cache and try again
3. Make sure you're using correct login credentials

**Your app is now live on GitHub Pages!** 🚀

