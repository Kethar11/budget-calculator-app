# 🌿 Branch Workflow Guide

## 📋 Branch Structure

- **`main`** (Production) → Auto-deploys to GitHub Pages (Live Site)
- **`dev`** (Development) → For testing and development

## 🚀 Workflow

### Development Workflow

1. **Work on dev branch:**
   ```bash
   git checkout dev
   # Make your changes
   git add .
   git commit -m "Your changes"
   git push origin dev
   ```

2. **Test your changes** on dev branch

3. **When ready for production:**
   ```bash
   git checkout main
   git merge dev
   git push origin main
   ```
   → **Automatically deploys to live site!**

### Quick Commands

```bash
# Switch to dev branch
git checkout dev

# Switch to main branch
git checkout main

# Merge dev into main (for production)
git checkout main
git merge dev
git push origin main
```

## ⚙️ How It Works

- **`dev` branch**: 
  - Use for development and testing
  - Push changes here first
  - No automatic deployment

- **`main` branch**:
  - Production-ready code only
  - Auto-deploys to GitHub Pages on push
  - Live site: `https://Kethar11.github.io/budget-calculator-app`

## 📊 Current Status

✅ **dev branch**: Created and pushed  
✅ **main branch**: Up to date with dev  
✅ **Auto-deployment**: Configured for main branch only

## 🎯 Best Practices

1. **Always develop on `dev` branch**
2. **Test thoroughly on `dev`**
3. **Merge to `main` only when ready for production**
4. **Main branch = Live site automatically**

## 🔄 Typical Workflow

```bash
# 1. Start working
git checkout dev

# 2. Make changes and commit
git add .
git commit -m "Add new feature"
git push origin dev

# 3. Test on dev branch

# 4. When ready, deploy to production
git checkout main
git merge dev
git push origin main
# → Auto-deploys in 2-3 minutes!
```

## ⚠️ Important Notes

- **Only `main` branch deploys to live site**
- **`dev` branch is for development only**
- **Always merge dev → main for production**
- **Never push directly to main** (unless urgent hotfix)

---

**Your live site updates automatically when you push to `main`!** 🎉

