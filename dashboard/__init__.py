#
# This file is part of the Robotic Observatory Control Kit (rockit)
#
# rockit is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# rockit is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with rockit.  If not, see <http://www.gnu.org/licenses/>.

# pylint: disable=invalid-name

import json
import os.path
import stat

from astropy.time import Time
import astropy.units as u
import pymysql

from flask import abort
from flask import Flask
from flask import jsonify
from flask import redirect
from flask import render_template
from flask import request
from flask import send_from_directory
from flask import url_for

from werkzeug.security import safe_join
from werkzeug.utils import secure_filename
# pylint: disable=missing-docstring

FILES_ROOT = '/home/observer/Public'

GENERATED_DATA_DIR = '/var/www/dashboard/generated'
GENERATED_DATA = {
    'preview/thumb': 'preview-thumb.jpg',
    'preview/clip': 'preview-clip.jpg',
}

DATABASE_DB = 'ops'
DATABASE_USER = 'ops'

app = Flask(__name__, static_folder='../static')

# Stop Flask from telling the browser to cache dynamic files
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = -1


@app.route('/data/<path:path>')
def generated_data(path):
    if path in GENERATED_DATA:
        return send_from_directory(GENERATED_DATA_DIR, GENERATED_DATA[path])
    abort(404)


@app.route('/')
def dashboard():
    return render_template('dashboard.html')


@app.route('/environment/')
def environment():
    return render_template('environment.html')


@app.route('/vnc/')
def vnc():
    return render_template('vnc.html')


@app.route('/files/', methods=['GET', 'POST'])
@app.route('/files/<path:directory>', methods=['GET', 'POST'])
def files(directory=''):
    path = safe_join(FILES_ROOT, directory)
    if path is None:
        return abort(403)

    if request.method == 'POST':
        # check if the post request has the file part
        if 'file' not in request.files:
            return redirect(request.url)

        f = request.files['file']
        if f and f.filename:
            filename = secure_filename(f.filename)
            f.save(os.path.join(path, filename))
            return redirect(request.url)

    table = []
    if directory:
        parent = safe_join(FILES_ROOT, os.path.join(directory, '..'))
        if parent:
            info = os.stat(parent)
            modified = Time(info.st_mtime, format='unix').strftime('%Y-%m-%d&nbsp;%H:%M:%S')
            table.append((url_for('files', directory=os.path.join(directory, '..')), 'bi-folder2', '..', modified, '-'))

    units = ['B', 'KiB', 'MiB', 'GiB']
    for filename in os.listdir(path):
        if filename.startswith('.'):
            continue
        try:
            info = os.stat(os.path.join(path, filename))
            if stat.S_ISDIR(info.st_mode):
                url = url_for('files', directory=os.path.join(directory, filename))
                icon = 'bi-folder2'
                size = '-'
            else:
                url = url_for('file', path=os.path.join(directory, filename))
                icon = 'bi-file-earmark'
                size = info.st_size
                i = 0
                while size > 1024 and i < len(units):
                    size /= 1024
                    i += 1

                size = f'{size:.2f}&nbsp;{units[i]}'

            modified = Time(info.st_mtime, format='unix').strftime('%Y-%m-%d&nbsp;%H:%M:%S')
            table.append((url, icon, filename, modified, size))
        except:
            pass

    return render_template('files.html', table=table, directory=directory)


@app.route('/file/<path:path>')
def file(path):
    return send_from_directory(FILES_ROOT, path)


@app.route('/camera/<path:camera>')
def camera_image(camera):
    if camera in ['eumetsat', 'allsky', 'dome', 'telescope']:
        return send_from_directory(GENERATED_DATA_DIR, camera + '.jpg')
    abort(404)


@app.route('/camera/<path:camera>/thumb')
def camera_thumb(camera):
    if camera in ['eumetsat', 'allsky', 'dome', 'telescope']:
        return send_from_directory(GENERATED_DATA_DIR, camera + '_thumb.jpg')
    abort(404)


@app.route('/data/dashboard')
def dashboard_data():
    data = json.load(open(GENERATED_DATA_DIR + '/dashboard.json'))
    data['previews'] = {
        'qhy600m': json.load(open(GENERATED_DATA_DIR + '/preview.json')),
    }
    return jsonify(**data)


@app.route('/data/environment')
def environment_data():
    path = 'latest.json.gz'
    if 'date' in request.args:
        # Map today's date to today.json
        # HACK: use .datetime to work around missing strftime on ancient astropy
        now = Time.now()
        today = Time(now.datetime.strftime('%Y-%m-%d'), format='isot', scale='utc') + 12 * u.hour
        if today > now:
            today -= 1 * u.day

        if today.strftime('%Y-%m-%d') == request.args['date']:
            path = 'today.json.gz'
        else:
            # Validate that it is a well-formed date
            date = Time(request.args['date'], format='isot', scale='utc')
            path = date.datetime.strftime('%Y/%Y-%m-%d.json.gz')

    response = send_from_directory(GENERATED_DATA_DIR, os.path.join('weather', path))
    response.headers['Content-Encoding'] = 'gzip'
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


@app.route('/data/log')
def warwick_log():
    sources = {
        'powerd@warwick': 'power',
        'meaded@warwick': 'mount',
        'ashdomed@warwick': 'dome',
        'opsd@warwick': 'ops',
        'pipelined@warwick': 'pipeline',
        'qhy_camd@warwick': 'camera',
        'diskspaced@warwick': 'diskspace',
        'environmentd@warwick': 'environment',
        'dashboardd@warwick': 'dashboard',
        'vaisalad@warwick': 'vaisala',
        'cloudwatcherd@warwick': 'cloudwatcher',
        'weatherlogd': 'weatherdb'
    }

    try:
        db = pymysql.connect(db=DATABASE_DB, user=DATABASE_USER, autocommit=True)
        try:
            # Returns latest 250 log messages.
            # If 'from' argument is present, returns latest 250 log messages with a greater id
            with db.cursor() as cur:
                args = list(sources.keys())
                in_list = ','.join(['%s'] * len(args))
                query = f'SELECT id, date, type, source, message from obslog WHERE source IN ({in_list})'
                if 'from' in request.args:
                    query += ' AND id > %s'
                    args.append(request.args['from'])

                query += ' ORDER BY id DESC LIMIT 250;'
                cur.execute(query, args)
                messages = [(x[0], x[1].isoformat(), x[2], sources[x[3]], x[4]) for x in cur]
                return jsonify(messages=messages)
        finally:
            db.close()
    except:
        return {}
