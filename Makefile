install:
	@install -d /var/www/dashboard/generated
	@cp -rv dashboard static dashboard.ini /var/www/dashboard/
	@cp update-dashboard-data update-dashboard-webcams /usr/bin/
	@cp dashboard.service update-dashboard-data.service update-dashboard-webcams.service /usr/lib/systemd/system/
	@cp dashboard.conf /etc/nginx/conf.d/
	@chown -R nginx:nginx /var/www/dashboard
