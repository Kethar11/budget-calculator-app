# 🚀 Automatic Deployment to GitHub Pages

Your app is configured to **automatically deploy to GitHub Pages** whenever you push to the `main` branch!

## ✅ How It Works

1. **Push to main branch** → GitHub Actions automatically:
   - Builds your React app
   - Deploys to GitHub Pages
   - Your live site updates automatically!

2. **Your live site**: `https://Kethar11.github.io/budget-calculator-app`

## 📋 Setup Steps (One-Time)

### Step 1: Enable GitHub Pages in Repository Settings

1. Go to your GitHub repository: `https://github.com/Kethar11/budget-calculator-app`
2. Click **Settings** (top menu)
3. Scroll down to **Pages** (left sidebar)
4. Under **Source**, select:
   - **Source**: `GitHub Actions` (NOT "Deploy from a branch")
5. Click **Save**

### Step 2: Verify Workflow File

The workflow file (`.github/workflows/deploy.yml`) is already configured and will:
- Trigger on every push to `main` branch
- Build your React app
- Deploy to GitHub Pages automatically

## 🎯 How to Deploy

### Option 1: Push to Main (Automatic)
```bash
git add .
git commit -m "Your changes"
git push origin main
```
**That's it!** GitHub Actions will automatically deploy in ~2-3 minutes.

### Option 2: Manual Deploy (if needed)
```bash
npm run build
npm run deploy
```

## 📊 Check Deployment Status

1. Go to your repository on GitHub
2. Click **Actions** tab (top menu)
3. You'll see deployment status:
   - ✅ Green checkmark = Successfully deployed
   - ❌ Red X = Deployment failed (check logs)

## 🔍 View Your Live Site

After deployment completes:
- **Live URL**: `https://Kethar11.github.io/budget-calculator-app`
- Usually takes 1-3 minutes after push

## ⚠️ Important Notes

1. **Backend API**: The live site will try to connect to `http://localhost:8000` by default
   - For production, you'll need to:
     - Deploy backend separately (Heroku, Railway, etc.)
     - Update `REACT_APP_BACKEND_URL` environment variable
     - Or use a different backend URL

2. **First Deployment**: 
   - May take 5-10 minutes
   - GitHub Pages needs to initialize

3. **Subsequent Deployments**:
   - Usually 2-3 minutes
   - Automatic on every push to `main`

## 🐛 Troubleshooting

### Deployment Fails?
1. Check **Actions** tab for error logs
2. Common issues:
   - Build errors (check `npm run build` locally)
   - Missing dependencies
   - GitHub Pages not enabled

### Site Not Updating?
1. Wait 2-3 minutes
2. Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
3. Check Actions tab for deployment status

### Need to Change Branch?
Edit `.github/workflows/deploy.yml`:
```yaml
on:
  push:
    branches:
      - main  # Change this to your production branch
```

## ✨ Summary

- ✅ **Automatic**: Push to `main` → Auto-deploy
- ✅ **Fast**: 2-3 minutes per deployment
- ✅ **Free**: GitHub Pages is free
- ✅ **Easy**: No manual steps needed!

Just push to `main` and your site updates automatically! 🎉

