function updateListGroup(prefix, fields, data) {
  for (var key in fields) {
    var row = $('#'+prefix+'-'+key);
    row.children('span.pull-right').remove();
    row.attr('class', 'list-group-item');
    var value = $('<span class="pull-right">');
    var valueDisplay = fields[key](data);

    if (valueDisplay.length > 0)
      value.html(valueDisplay[0]);
    if (valueDisplay.length > 1)
      value.addClass(valueDisplay[1])
    if (valueDisplay.length > 2)
      row.addClass(valueDisplay[2])
    row.append(value)
  }
}

function parseUTCDate(str) {
  var d = str.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+).(\d+)/);
  while (d[7] > 1000)
    d[7] /= 10;

  var utc = Date.UTC(d[1], d[2] - 1, d[3], d[4], d[5], d[6], d[7]);
  return new Date(utc);
}

function formatUTCDate(date) {
  var d = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
    date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()];

  for (i = 0; i < d.length; i++)
    if (d[i] < 10)
      d[i] = '0' + d[i];

  return d[0] + '-' + d[1] + '-' + d[2] + ' ' + d[3] + ':' + d[4] + ':' + d[5];
}

function updateGroups(data) {
  $('[data-generator]').each(function() {
    // Remove old content
    $(this).children('span.float-end').remove();

    if (!$(this).is("td"))
    $(this).attr('class', 'list-group-item');

    // Add new content
    const generator = $(this).data('generator');
    const index = $(this).data('index');

    let fieldData = data;
    for (var i in index) {
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

  const date = 'date' in data ? parseUTCDate(data['date']) : new Date();
  $('#data-updated').html('Updated ' + formatUTCDate(date) + ' UTC');
}

function pollDashboard(url) {
  $.ajax({
    type: 'GET',
    dataType: 'json',
    url: url,
    statusCode: {
      404: function() {
        updateGroups({});
      }
    }
  }).done(function(msg) {
    updateGroups(msg);
  });

  window.setTimeout(function() { pollDashboard(url); }, 10000);
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

function diskSpaceGB(row, cell, data) {
  if ('latest' in data) {
    let display = +(data['latest'] / 1073741824).toFixed(1);
    const units = row.data('units');
    if (units)
      display += units;
    cell.html(display);
    cell.addClass(fieldLimitsColor(data, data['latest']));
  }
}

function opsHeaderMode(row, cell, data) {
  const modes = [
    ['ERROR', 'list-group-item-danger'],
    ['AUTO', 'list-group-item-success'],
    ['MANUAL', 'list-group-item-warning'],
  ];

  const mode = data in modes ? modes[data] : mode[0];
  cell.html(mode[0]);
  row.addClass(mode[1]);
}

function opsHeaderEnvironment(row, cell, data) {
  if (('safe' in data) && ('conditions' in data)) {
    cell.html(data['safe'] ? 'SAFE' : 'NOT SAFE');
    row.addClass(data['safe'] ? 'list-group-item-success' : 'list-group-item-danger');
  } else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}

function powerOnOff(row, cell, data) {
  if (data === 2) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data === 1) {
    cell.html('POWER ON');
    cell.addClass('text-success');
  } else {
    cell.html('POWER OFF');
    cell.addClass('text-danger');
  }
}

function powerOffOn(row, cell, data) {
  if (data === 2) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data === 1) {
    cell.html('POWER ON');
    cell.addClass('text-danger');
  } else {
    cell.html('POWER OFF');
    cell.addClass('text-success');
  }
}

function domeTime(row, cell, data) {
  if (data == null)
    cell.html('N/A');
  else {
    cell.html(data);
    cell.addClass('text-warning');
  }
}

function domeShutter(row, cell, data) {
  const state = [
    ['DISCONNECTED', 'text-danger'],
    ['CLOSED', 'text-danger'],
    ['OPEN', 'text-success'],
    ['PARTIALLY OPEN', 'text-info'],
    ['OPENING', 'text-warning'],
    ['CLOSING', 'text-warning'],
    ['FORCE CLOSING', 'text-danger']
  ];

  if (data >= 0 && data < state.length) {
    cell.html(state[data][0]);
    cell.addClass(state[data][1]);
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function domeAzimuth(row, cell, data) {
  const state = [
    ['DISCONNECTED', 'text-danger'],
    ['NOT HOMED', 'text-warning'],
    ['IDLE', ''],
    ['MOVING', 'text-warning'],
    ['HOMING', 'text-warning'],
  ];

  if ('azimuth_status' in data) {
    let label = state[data['azimuth_status']][0]
    if (data['azimuth_status'] === 2) {
      label += ' (' + data['azimuth'].toFixed(0) + ' deg)'
    }
    cell.html(label);
    cell.addClass(state[data['azimuth_status']][1]);
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function domeHeartbeat(row, cell, data) {
  const state = [
    ['DISABLED', 'text-warning'],
    ['ACTIVE', 'text-success'],
    ['CLOSING DOME', 'text-danger'],
    ['TRIPPED', 'text-danger'],
    ['UNAVAILABLE', 'text-warning']
  ];

  let label = 'DISCONNECTED';
  let style = 'text-danger';

  if ('heartbeat_status' in data && 'heartbeat_remaining' in data) {
    if (data['heartbeat_status'] === 1) {
      label = data['heartbeat_remaining'].toFixed(0) + 's remaining';
      if (data['heartbeat_remaining'] < 30)
        style = 'text-danger'
      else if (data['heartbeat_remaining'] < 60)
        style = 'text-warning';
      else
        style = 'text-success';
    } else {
      label = state[data['heartbeat_status']][0];
      style = state[data['heartbeat_status']][1];
    }
  }

  cell.html(label);
  cell.addClass(style);
}

function acpInfo(row, cell, data){
  cell.html(data.toUpperCase());
}

function acpRADec(row, cell, data) {
  if (!('tel_status' in data))
  {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data['tel_status'] === 'Offline') {
    cell.html('N/A');
  } else {
    cell.html(data['tel_ra'] + ' / ' + data['tel_dec']);
  }
}
function acpAltAz(row, cell, data){
  if (!('tel_status' in data))
  {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data['tel_status'] === 'Offline') {
    cell.html('N/A');
  } else {
    cell.html(data['tel_alt'] + ' / ' + data['tel_az']);
  }
}


