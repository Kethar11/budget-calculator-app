# Simple Deployment Guide

## 🚀 Automatic Deployment

**Your app automatically deploys to GitHub Pages when you push to `main` branch!**

### How It Works

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes and commit:**
   ```bash
   git add .
   git commit -m "Add new feature"
   ```

3. **Push to feature branch:**
   ```bash
   git push origin feature/my-new-feature
   ```

4. **Create Pull Request** (optional, for review)

5. **Merge to main:**
   ```bash
   git checkout main
   git merge feature/my-new-feature
   git push origin main
   ```

6. **Auto-deploy:** GitHub Actions automatically builds and deploys to:
   **https://Kethar11.github.io/budget-calculator-app**

---

## 📋 Manual Deployment (if needed)

If automatic deployment doesn't work:

```bash
npm install --save-dev gh-pages
npm run build
npx gh-pages -d build
```

---

## 🔐 Login Credentials

- **Username:** `jasper`
- **Password:** `780788`

---

## ✨ Features

- ✅ **Automatic Deployment** - Push to main = Live update
- ✅ **Simple Login** - Username/Password authentication
- ✅ **No Backend Required** - Works with IndexedDB (local storage)
- ✅ **Mobile Responsive** - Works on all devices
- ✅ **All Features** - Budget, Savings, Expenses calculators

---

## 🛠️ Development Workflow

1. **Work on feature branch:**
   ```bash
   git checkout -b feature/add-chart
   # Make changes
   git add .
   git commit -m "Add new chart"
   git push origin feature/add-chart
   ```

2. **Test locally:**
   ```bash
   npm start
   # Test at http://localhost:3000
   ```

3. **Merge to main (auto-deploys):**
   ```bash
   git checkout main
   git merge feature/add-chart
   git push origin main
   ```

4. **Wait 2-3 minutes** for GitHub Actions to deploy

5. **Check live site:**
   https://Kethar11.github.io/budget-calculator-app

---

## 📝 Notes

- **No Electron/APK** - Simple web app only
- **No Backend Required** - All data stored in browser (IndexedDB)
- **Excel Sync** - Optional (requires backend running)
- **Auto-deploy** - Every push to main branch

---

## 🐛 Troubleshooting

### Deployment not working?
1. Check GitHub Actions tab in your repo
2. Look for errors in the workflow
3. Make sure `main` branch exists
4. Verify `package.json` has correct homepage URL

### Build fails?
```bash
npm run build
# Check for errors
```

### Site not updating?
- Wait 2-3 minutes (GitHub Pages takes time)
- Clear browser cache
- Check GitHub Pages settings in repo

---

**That's it! Simple and automatic!** 🎉

