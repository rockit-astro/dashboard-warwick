function parseUTCDate(str) {
  var d = str.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+).(\d+)/);
  while (d[7] > 1000)
    d[7] /= 10;

  var utc = Date.UTC(d[1], d[2] - 1, d[3], d[4], d[5], d[6], d[7]);
  return new Date(utc);
}

function formatUTCDate(date) {
  let d = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
    date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()];

  for (let i = 0; i < d.length; i++)
    if (d[i] < 10)
      d[i] = '0' + d[i];

  return d[0] + '-' + d[1] + '-' + d[2] + '&nbsp;' + d[3] + ':' + d[4] + ':' + d[5];
}

function sexagesimal(angle) {
  const negative = angle < 0
  angle = Math.abs(angle)

  let degrees = Math.floor(angle)
  angle = (angle - degrees) * 60
  let minutes = Math.floor(angle)
  let seconds = ((angle - minutes) * 60).toFixed(1)

  if (degrees < 10)
    degrees = '0' + degrees
  if (minutes < 10)
    minutes = '0' + minutes
  if (seconds < 10)
    seconds = '0' + seconds

  if (negative)
    degrees = '-' + degrees

  return degrees + ':' + minutes + ':' + seconds
}

function updateGroups(data, filter = '') {
  $(filter + ' [data-notify]').each(function () {
    window[$(this).data('notify')]($(this), data);
  });

  $(filter + ' [data-generator]').each(function () {
    // Remove old content
    $(this).children('span.float-end').remove();

    if (!$(this).is("td"))
      $(this).attr('class', 'list-group-item');

    // Add new content
    const generator = $(this).data('generator');
    const index = $(this).data('index');

    let fieldData = data;
    for (let i in index) {
      fieldData = fieldData && index[i] in fieldData ? fieldData[index[i]] : undefined;
      if (fieldData === undefined)
        break;
    }

    const cell = $('<span class="float-end">');
    if (fieldData === undefined) {
      cell.html('ERROR');
      cell.addClass('text-danger');
    } else if (window[generator])
      window[generator]($(this), cell, fieldData);

    $(this).append(cell);
  });

  if (filter.length === 0) {
    const date = 'date' in data ? parseUTCDate(data['date']) : new Date();
    $('#data-updated').html('Updated ' + formatUTCDate(date) + ' UTC');
  }
}

function pollDashboard(url) {
  $.ajax({
    type: 'GET',
    dataType: 'json',
    url: url,
    statusCode: {
      404: function () {
        updateGroups({});
      }
    }
  }).done(function (msg) {
    updateGroups(msg);
  });

  window.setTimeout(function () {
    pollDashboard(url);
  }, 10000);
}

function getData(data, index) {
  for (let i in index) {
    data = data && index[i] in data ? data[index[i]] : undefined;
    if (data === undefined)
      break;
  }

  return data;
}

// Environment generators
function fieldLimitsColor(field, value) {
  if (!('limits' in field))
    return null;

  if (field['disabled'])
    return 'text-info';

  if (value < field['limits'][0] || value > field['limits'][1])
    return 'text-danger';

  if ('warn_limits' in field && (value < field['warn_limits'][0] || value > field['warn_limits'][1]))
    return 'text-warning';

  return 'text-success';
}

function envLatestMinMax(row, cell, data) {
  if ('latest' in data) {
    let precision = row.data('precision');
    if (precision === undefined)
      precision = 1;

    let display = data['latest'].toFixed(precision);
    const units = row.data('units');
    if (units)
      display += units;
    cell.html(display);
    cell.addClass(fieldLimitsColor(data, data['latest']));
  } else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }

  if ('max' in data && 'min' in data) {
    const maxValue = $('<span>');
    maxValue.html(data['max'].toFixed(1));
    maxValue.addClass(fieldLimitsColor(data, data['max']));

    const minValue = $('<span>');
    minValue.html(data['min'].toFixed(1));
    minValue.addClass(fieldLimitsColor(data, data['min']));

    const maxMinValue = $('<span class="float-end data-minmax">');
    maxMinValue.append(maxValue);
    maxMinValue.append('<br>');
    maxMinValue.append(minValue);
    cell.append(maxMinValue);
  }
}

function seeingIfAvailable(row, cell, data) {
  if ('latest' in data && data['latest'] > 0) {
    let display = data['latest'].toFixed(2);
    const units = row.data('units');
    if (units)
      display += units;
    cell.html(display);
  } else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}

function opsConditionsTooltip(row, data) {
  const status_classes = ['', 'text-success', 'text-warning', 'text-danger'];
  const status_labels = ['UNKNOWN', 'SAFE', 'WARN', 'UNSAFE']
  let tooltip = '<table style="margin: 5px">';
  let rows = 0;
  for (let c in data['conditions']) {
    if (!(c in data['conditions']))
      continue;

    tooltip += '<tr><td style="text-align: right;">' + c + ':</td>';
    const params = data['conditions'][c];
    for (let p in params)
      tooltip += '<td style="padding: 0 5px" class="' + status_classes[params[p]] + '">' + status_labels[params[p]] + '</td>';

    tooltip += '</tr>';
    rows += 1;
  }

  if (rows === 0)
    tooltip += '<tr><td style="text-align: center;">NO DATA</td></tr>'
  tooltip += '</table>';

  row.tooltip({
    title: tooltip,
    html: true,
    sanitize: false,
    animation: false,
    container: 'body',
    customClass: 'ops-tooltip'
  });
}

function opsStatus(row, cell, data) {
  if ('safe' in data && 'conditions' in data && 'dome_closed' in data && 'dome_auto' in data) {
    const mode_class = data['dome_auto'] ? 'text-success' : 'text-warning';
    const mode_label = data['dome_auto'] ? 'AUTO' : 'MANUAL';
    const dome_class = data['observable'] ^ data['dome_closed'] ? 'text-success' : 'text-danger';
    const dome_label = data['dome_closed'] ? 'CLOSED' : 'OPEN';
    let label = '<span class="' + mode_class + '">' + mode_label + '</span>&nbsp;/&nbsp;<span class="' + dome_class + '">' + dome_label + '</span>';

    if (!data['safe'])
      label += '&nbsp;(<span class="text-danger">ENV</span>)';

    cell.html(label);
    opsConditionsTooltip(row, data);
  } else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}
