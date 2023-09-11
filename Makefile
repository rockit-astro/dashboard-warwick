RPMBUILD = rpmbuild --define "_topdir %(pwd)/build" \
        --define "_builddir %{_topdir}" \
        --define "_rpmdir %{_topdir}" \
        --define "_srcrpmdir %{_topdir}" \
        --define "_sourcedir %(pwd)"

all:
	mkdir -p build
	${RPMBUILD} --define "_version $$(date --utc +%Y%m%d%H%M%S)" -ba rockit-dashboard-warwick.spec
	mv build/noarch/*.rpm .
	rm -rf build

install:
	@install -d /var/www/dashboard/generated
	@cp -rv dashboard static dashboard.ini /var/www/dashboard/
	@cp update-dashboard-data update-dashboard-webcams /usr/bin/
	@cp dashboard.service update-dashboard-data.service update-dashboard-webcams.service /usr/lib/systemd/system/
	@cp dashboard.conf /etc/nginx/conf.d/
	@chown -R nginx:nginx /var/www/dashboard
