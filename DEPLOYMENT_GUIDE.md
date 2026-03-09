# 🚀 Hướng Dẫn Deploy - Frontend Vercel + Backend Render

## ❓ Problem tôi vừa fix

**Vấn đề chính**: Frontend Vercel không gọi được API Render khi mở lần đầu, nhưng sau khi chạy local thì lại hoạt động.

**Nguyên nhân**:
1. ❌ Frontend hardcoding URL thay vì dùng environment variables
2. ❌ CORS chưa cấu hình cho domain Vercel  
3. ❌ Render backend bị sleep (cold start) sau 15 phút inactivity
4. ❌ Không có retry logic khi backend startup chậm

---

## 🔧 Các Fix Đã Thực Hiện

### 1. **Frontend: Dùng Environment Variables** ✅
- Thay từ: `window.location.hostname === 'localhost'` 
- Thành: `import.meta.env.VITE_API_URL`
- File: `frontend-react/src/App.jsx` (dòng 297)

### 2. **Backend: Cổng CORS tốt hơn** ✅
- Thêm explicit list cho Vercel domains
- Support dynamic ALLOWED_ORIGINS từ env
- File: `Backend/server.js` (dòng 44-71)

### 3. **Warmup Endpoint** ✅
- Thêm `/warmup` endpoint để tránh cold start
- Frontend call warmup mỗi 10 phút
- Files: `Backend/server.js` + `frontend-react/src/App.jsx`

### 4. **Retry Logic với Exponential Backoff** ✅
- Tự động retry 2 lần khi backend lỗi
- Delays: 1s → 3s → 5s
- File: `frontend-react/src/App.jsx` (dòng 264-318)

---

## 📋 Step-by-Step Deployment

### **STEP 1: Cấu hình Vercel (Frontend)**

#### 1.1 Kết nối GitHub
```bash
# Đẩy code lên GitHub
git push origin main
```

#### 1.2 Import project trên Vercel
1. Vào https://vercel.com/new
2. Chọn GitHub repo
3. Cấu hình:
   - **Root Directory**: `frontend-react`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### 1.3 Thiết lập Environment Variables trên Vercel
1. Vào **Settings** → **Environment Variables**
2. Thêm biến:

```
VITE_API_URL=https://l-ia-dans-la-gestion-des-risques-qviy.onrender.com
```

> ⚠️ **Thay URL bằng domain Render backend của bạn**

3. Apply cho tất cả environments (Production, Preview, Development)
4. Redeploy

#### 1.4 Verify
- Sau deploy, check Vercel logs để xác nhận API URL
- Console của browser sẽ log: `📡 Backend URL: https://...`

---

### **STEP 2: Cấu hình Render (Backend)**

#### 2.1 Environment Variables trên Render
1. Vào Render Dashboard → Select service
2. Vào **Environment** → **Environment Variables**
3. Thêm/update các biến:

```
NODE_ENV=production
FLASK_URL=https://your-flask-Backend.onrender.com
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

**Ví dụ cụ thể**:
```
NODE_ENV=production
FLASK_URL=https://health-risk-python.onrender.com
ALLOWED_ORIGINS=https://l-ia-dans-la-gestion-des-risques.vercel.app,https://your-domain.com
```

> 📝 **Lưu ý**: 
> - Nếu có nhiều Vercel domain, dùng dấu phẩy để tách (không space)
> - FLASK_URL phải là URL của Flask AI Engine (Python service)

#### 2.2 Restart service sau khi update env
1. Vào **Deployments**
2. Click "..." → **Redeploy** (hay trigger rebuild)

#### 2.3 Verify CORS
Chạy lệnh kiểm tra:
```bash
# Từ machine có Vercel domain, test health check
curl -H "Origin: https://your-frontend.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     https://your-Backend.onrender.com/health
```

---

### **STEP 3: Tránh Cold Start Render**

**Vấn đề**: Render free tier sleep backend sau 15 phút không dùng.

**Giải pháp 1: Warmup từ Frontend** ✅ (Đã implement)
- Frontend tự động call `/warmup` mỗi 10 phút
- Giữ backend luôn sẵn sàng

**Giải pháp 2: Upgrade Render Plan** 💰
- Nâng lên **Starter Plan** (~$7/month) → không sleep
- Hay **Pro Plan** (~$25/month) → SLA 99.99%

**Giải pháp 3: External Scheduler** (Optional)
Website như https://kaffeine.herokuapp.com/ hoặc https://easycron.com/ có thể ping endpoint định kỳ:
```
https://your-Backend.onrender.com/warmup
```
Cấu hình mỗi 10-15 phút

---

## 🧪 Testing Deployment

### Test 1: Verify Environment Variables
**Browser Console**:
```javascript
// Kiểm tra API URL được dùng
console.log(import.meta.env.VITE_API_URL);
```

### Test 2: Check CORS
**Browser Network Tab**:
1. Mở DevTools → Network
2. Submit form để analyze
3. Tìm request POST `/analyze`:
   - ✅ **Đúng**: Status 200/201, response có data
   - ❌ **CORS Error**: Status 0, message "CORS policy"

### Test 3: Check Logs
**Vercel Logs**:
```bash
vercel logs --tail
# Hoặc vào Vercel Dashboard → Deployments → View logs
```

**Render Logs**:
- Vào Render Dashboard → Select service → Logs
- Tìm logs từ backend: `[ANALYZE]`, `[CORS]`

---

## 🐛 Troubleshooting

### Problem 1: "CORS policy: No 'Access-Control-Allow-Origin'"

**Solution**:
1. Check `ALLOWED_ORIGINS` env var trên Render
2. Verify format: `https://your-frontend.vercel.app` (không có trailing slash)
3. Restart Render service
4. Check backend logs: `[CORS]`

```bash
# Verify CORS từ command line
curl -i -X OPTIONS https://your-Backend.onrender.com/analyze \
  -H "Origin: https://your-frontend.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

### Problem 2: "Service Unavailable" / Timeout

**Nguyên nhân**: Backend đang startup hoặc Flask không chạy
**Solution**:
1. Check Render logs → Flask service status
2. Verify `FLASK_URL` env var trên Render backend
3. Nếu Flask trên Render khác: update `FLASK_URL`
4. Wait 1-2 phút và retry (first request trigger cold start)

### Problem 3: "Timeout sau 30s"

**Nguyên nhân**: Flask analysis chậm hoặc Network lag
**Solution**:
1. Check Flask logs (Render Python service)
2. Tăng timeout nếu cần: File `App.jsx` dòng 311
3. Check network của machine (ping backend)

```bash
# Ping backend
curl https://your-Backend.onrender.com/health
```

---

## 📊 Environment Checklist

### Frontend (Vercel)
- [ ] GitHub repo connected
- [ ] Root directory set to `frontend-react`
- [ ] `VITE_API_URL` environment variable configured
- [ ] Build succeeds (check Vercel logs)
- [ ] Can access Vercel URL
- [ ] Browser console shows correct API URL

### Backend (Render)
- [ ] `NODE_ENV=production`
- [ ] `FLASK_URL` pointing to Flask service
- [ ] `ALLOWED_ORIGINS` includes Vercel domain(s)
- [ ] Service is running (check status)
- [ ] `/health` endpoint responds
- [ ] `/warmup` endpoint responds

### Flask AI Engine (Render/Other)
- [ ] Service is running
- [ ] `/health` endpoint responds
- [ ] `/analyze` endpoint working
- [ ] URL matches `FLASK_URL` from Node backend

---

## 📱 Monitoring

### Setup monitoring để avoid issues:

**1. Uptime Robot** (Free)
- https://uptimerobot.com
- Monitor `https://your-Backend.onrender.com/health` mỗi 5 phút
- Alert qua email nếu down

**2. Render Health Checks**
- Render dashboard → Service → Settings → Health Check
- Set URL: `/health`
- Interval: 5 minutes

**3. Browser DevTools**
- Regularly check Network tab cho API requests
- Check Console cho errors

---

## 🎯 Next Steps

1. **Update environment variables** (Vercel + Render)
2. **Redeploy** cả Frontend + Backend
3. **Test** từ Vercel URL
4. **Monitor** Render logs (Logs tab)
5. **Setup uptime monitoring** (nếu production important)

---

## 📞 Quick Support

### Logs để check:

**Vercel (Frontend)**:
```
vercel logs --tail frontend-react
# Tìm: "📡 Backend URL: ..."
```

**Render (Node Backend)**:
```
# Logs tab - tìm:
[CORS] Allowed origins: [...]
[ANALYZE] Transmission au moteur IA Flask
[ANALYZE] Réponse reçue du moteur IA
```

---

**Good luck! 🚀 Nếu còn issue, check logs + environment variables trước!**
