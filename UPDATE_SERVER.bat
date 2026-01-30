@echo off
echo ==========================================
echo       UPDATING ATTENDANCE SERVER (FIX)
echo ==========================================
echo.
echo Connecting to 34.126.121.250...

ssh ahmads_muzayyin_gmail_com@34.126.121.250 "cd attendance/smart-school && git checkout package-lock.json && git pull origin master && cd backend && npm install && npx prisma generate && npm run build && pm2 restart all"

echo.
echo ==========================================
echo       UPDATE FINISHED
echo ==========================================
echo.
echo Please try the app again. 
echo.
pause
