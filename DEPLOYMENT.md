# BlockCertify Deployment Guide

## 🚀 Hosting Options

### Option 1: Vercel (Recommended - Free & Easy)

**Frontend + Backend Hosting**

1. **Prerequisites:**
   - GitHub account
   - Vercel account (sign up at vercel.com)

2. **Steps:**
   ```bash
   # Build frontend
   cd frontend
   npm run build
   cd ..
   
   # Push to GitHub first
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

3. **Deploy on Vercel:**
   - Go to vercel.com → New Project
   - Import your GitHub repository
   - Vercel will auto-detect and deploy
   - Set environment variables in Vercel dashboard

### Option 2: Railway (Full-Stack Hosting)

**Single Platform for Backend + Database**

1. **Steps:**
   - Go to railway.app
   - Connect GitHub repository
   - Railway auto-deploys from main branch
   - Add environment variables

### Option 3: Netlify + Heroku

**Frontend on Netlify, Backend on Heroku**

1. **Frontend (Netlify):**
   ```bash
   cd frontend
   npm run build
   # Upload build folder to Netlify
   ```

2. **Backend (Heroku):**
   ```bash
   # Install Heroku CLI
   heroku create your-app-name
   git push heroku main
   ```

### Option 4: Traditional VPS (DigitalOcean, AWS, etc.)

**Full Control Hosting**

## 🔧 Pre-Deployment Setup

### 1. Environment Variables

Create `.env` file in backend:
```bash
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secure-secret
CORS_ORIGIN=https://your-domain.com
```

### 2. Build Frontend
```bash
cd frontend
npm run build
```

### 3. Test Production Build
```bash
# Set NODE_ENV=production
cd backend
npm start
```

## 🌐 Quick Deploy Commands

### Vercel (One-Click)
```bash
npm install -g vercel
vercel --prod
```

### Railway
```bash
npm install -g @railway/cli
railway login
railway deploy
```

### Netlify
```bash
npm install -g netlify-cli
cd frontend
npm run build
netlify deploy --prod --dir=build
```

## 📋 Production Checklist

- [ ] Frontend build created (`npm run build`)
- [ ] Environment variables configured
- [ ] CORS origins updated for production domain
- [ ] JWT secret set to secure value
- [ ] Database configured (if using MongoDB)
- [ ] SSL/HTTPS enabled
- [ ] Custom domain configured

## 🔗 Expected URLs After Deployment

- **Frontend:** `https://your-app.vercel.app`
- **Backend API:** `https://your-app.vercel.app/api`
- **Health Check:** `https://your-app.vercel.app/health`

## 🛠️ Troubleshooting

### Common Issues:
1. **CORS Error:** Update CORS_ORIGIN in environment variables
2. **API Not Found:** Check API routes start with `/api`
3. **Build Failed:** Check Node.js version compatibility
4. **Environment Variables:** Ensure all required vars are set

### Debug Commands:
```bash
# Check build
npm run build

# Test production locally
NODE_ENV=production npm start

# Check API health
curl https://your-domain.com/health
```

## 💡 Recommended Setup

**For Quick Testing:**
- Use Vercel (automatic deployment from GitHub)

**For Production:**
- Frontend: Vercel/Netlify
- Backend: Railway/Heroku
- Database: MongoDB Atlas

**Free Tier Limits:**
- Vercel: 100GB bandwidth/month
- Railway: 500 hours/month
- Netlify: 100GB bandwidth/month