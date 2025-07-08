Name:      rockit-dashboard-warwick
Version:   %{_version}
Release:   1%{dist}
Url:       https://github.com/rockit-astro/dashboard-warwick
Summary:   Web dashboard for the Marsh Observatory.
License:   GPL-3.0
Group:     Unspecified
BuildArch: noarch
Requires:  nginx python3-astropy python3-flask python3-websockify python3-rockit-common uwsgi uwsgi-plugin-python3
Requires:  mariadb-server rockit-obslog-server rockit-obslog-data-warwick rockit-weatherlog-warwick

%description

%build

mkdir -p %{buildroot}/var/www/dashboard/generated
cp -r %{_sourcedir}/dashboard %{buildroot}/var/www/dashboard
cp -r %{_sourcedir}/static %{buildroot}/var/www/dashboard
%{__install} %{_sourcedir}/dashboard.ini %{buildroot}/var/www/dashboard/

mkdir -p %{buildroot}%{_bindir}
%{__install} %{_sourcedir}/update-dashboard-data %{buildroot}%{_bindir}
%{__install} %{_sourcedir}/update-dashboard-webcams %{buildroot}%{_bindir}

mkdir -p %{buildroot}%{_unitdir}
%{__install} %{_sourcedir}/dashboard.service %{buildroot}%{_unitdir}
%{__install} %{_sourcedir}/dashboard-vnc-websocket.service %{buildroot}%{_unitdir}
%{__install} %{_sourcedir}/update-dashboard-data.service %{buildroot}%{_unitdir}
%{__install} %{_sourcedir}/update-dashboard-webcams.service %{buildroot}%{_unitdir}

mkdir -p %{buildroot}/etc/nginx/conf.d/
%{__install} %{_sourcedir}/dashboard.conf %{buildroot}/etc/nginx/conf.d/dashboard.conf

%files
%defattr(0744,nginx,nginx,0755)
/var/www/dashboard
/var/www/dashboard/generated

%defattr(-,root,root,-)
%{_unitdir}/dashboard.service
%{_unitdir}/dashboard-vnc-websocket.service
%{_unitdir}/update-dashboard-data.service
%{_unitdir}/update-dashboard-webcams.service
%{_bindir}/update-dashboard-data
%{_bindir}/update-dashboard-webcams
/etc/nginx/conf.d/dashboard.conf

%changelog
