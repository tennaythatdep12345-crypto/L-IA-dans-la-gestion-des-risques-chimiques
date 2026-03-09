# 🎯 Quick Deployment Checklist

## Before Deployment

- [ ] All code changes committed and pushed to GitHub
- [ ] `frontend-react/` and `Backend/` folders properly structured
- [ ] No hardcoded localhost URLs (done ✅ in App.jsx)
- [ ] No sensitive data in .env (only in env vars)

---

## Vercel Configuration (Frontend)

### Project Setup
- [ ] GitHub repo connected to Vercel
- [ ] Root directory: `frontend-react`
- [ ] Build command: `npm run build`
- [ ] Output: `dist`

### Environment Variables (Settings → Environment Variables)
```
VITE_API_URL=https://your-Backend.onrender.com
```
- [ ] Applied to Production
- [ ] Applied to Preview  
- [ ] Applied to Development
- [ ] Values don't have trailing slashes

### After Setup
- [ ] Deploy/redeploy project
- [ ] Check logs: `vercel logs --tail`
- [ ] Verify deployment is live at your domain

---

## Render Configuration (Backend)

### Node.js Service (Backend)

**Environment Variables** (Settings → Environment)
```
NODE_ENV=production
FLASK_URL=https://your-python-Backend.onrender.com
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

- [ ] `NODE_ENV=production`
- [ ] `FLASK_URL` pointing to correct Flask service
- [ ] `ALLOWED_ORIGINS` includes Vercel domain (no http://, no trailing slash)
- [ ] Values separated by comma if multiple domains

### After Setup
- [ ] Click "Redeploy" to apply env changes
- [ ] Check Logs tab for: `[CORS] Allowed origins`
- [ ] Verify health endpoint: `https://your-Backend.onrender.com/health`

### Flask Service (if on Render)

**Environment Variables**:
```
FLASK_ENV=production
PORT=5000
```

- [ ] Running (check status)
- [ ] `/health` endpoint responds
- [ ] URL matches `FLASK_URL` from Node backend

---

## Testing

### Test 1: Browser Console
```javascript
// Should show your Render URL (not localhost)
console.log(import.meta.env.VITE_API_URL)
```

### Test 2: Network Tab (DevTools)
1. Open DevTools (F12)
2. Go to Network tab
3. Fill form and submit
4. Look for POST `/analyze` request:
   - ✅ Status 200/201
   - ✅ Response has data
   - ✅ No CORS errors

### Test 3: Request Health Endpoint
```bash
curl https://your-Backend.onrender.com/health
# Should return JSON with status 'healthy'
```

### Test 4: Request Warmup Endpoint  
```bash
curl https://your-Backend.onrender.com/warmup
# Should return JSON with status 'warmed_up'
```

---

## Common Issues & Fixes

| Issue | Check | Fix |
|-------|-------|-----|
| "CORS policy" error | Logs tab for `[CORS]` | Update `ALLOWED_ORIGINS` env var |
| "Service Unavailable" | Render service status | Redeploy / Check Flask running |
| Timeout (>30s) | Render logs for Flask errors | Increase timeout or optimize Flask |
| Works locally but not Vercel | VITE_API_URL env var | Make sure env var is set and deployed |
| API works after a few minutes | Normal cold start | Frontend now has warmup mechanism |

---

## Performance Notes

✅ **What's been optimized**:
- [x] Automatic retry logic (2 retries max)
- [x] Warmup every 10 minutes (prevents sleep)
- [x] Proper CORS handling
- [x] 30s timeout for slow responses
- [x] Console logging for debugging

⚠️ **If still slow**:
- Render free tier = shared resources
- Upgrade to Starter ($7/mo) for better performance
- Or add external scheduler for more frequent warmups

---

## Monitoring

### Uptime Robot (Free)
1. Go to https://uptimerobot.com
2. Create monitor for: `https://your-Backend.onrender.com/health`
3. Check every 5 minutes
4. Alert on failure

### Render Alerts
1. Go to Render Dashboard
2. Select service
3. Settings → Alerts
4. Enable email alerts

---

## Support Resources

📚 **Documentation**:
- Vercel: https://vercel.com/docs
- Render: https://render.com/docs
- CORS: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

🔍 **Debug Tools**:
- Browser DevTools (F12)
- Vercel Logs: `vercel logs --tail`
- Render Logs: Dashboard → Logs tab
- cURL: Test endpoints from command line

💬 **Community**:
- Vercel Discord: https://discord.gg/vercel
- Render Discord: https://discord.gg/render

---

## Final Checklist Before Going Live

- [ ] Frontend deployed on Vercel
- [ ] Backend deployed on Render  
- [ ] All environment variables set
- [ ] API requests work from Vercel domain
- [ ] Logs show no errors
- [ ] Health check responds
- [ ] Warmup mechanism works
- [ ] Monitoring setup (optional but recommended)
- [ ] Documentation updated with live URLs
- [ ] Team knows how to monitor/debug

---

**🚀 Ready to go live!**
