# Fix for "Failed to Fetch" Error

## Changes Made

1. **Fixed API Request Function**: Updated the `apiRequest` function signature to match usage
2. **Added CORS Configuration**: Added proper CORS headers to allow cross-origin requests
3. **Fixed Default Port**: Changed default port from 5000 to 3000 to match .env
4. **Enhanced Error Handling**: Better network error detection and user feedback
5. **Added Health Check**: Added `/api/health` endpoint for testing connectivity

## Steps to Fix

1. **Restart the server**:
   ```bash
   npm run dev
   ```

2. **Test connectivity** by visiting: `http://localhost:3000/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

3. **Clear browser cache** and refresh the page

4. **Try module completion** again

## If Still Not Working

### Check Server Status
```bash
# Make sure server is running on port 3000
netstat -an | findstr :3000
```

### Test API Directly
Open browser console and run:
```javascript
fetch('/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to complete a module
4. Look for the POST request to `/api/student/progress/.../complete`
5. Check if it shows any specific error

## Common Solutions

### If Port 3000 is Busy
Change PORT in .env file:
```
PORT=3001
```

### If CORS Still Failing
Add to .env:
```
FRONTEND_URL=http://localhost:3000
```

### If Database Connection Issues
Verify PostgreSQL is running:
```bash
pg_isready -h localhost -p 5432
```

The module completion should now work without the "failed to fetch" error.