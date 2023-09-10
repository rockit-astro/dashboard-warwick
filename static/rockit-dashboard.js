// noinspection JSUnusedGlobalSymbols

function diskSpaceGB(row, cell, data) {
  if (data && 'latest' in data) {
    let display = +(data['latest'] / 1073741824).toFixed(1);
    const units = row.data('units');
    if (units)
      display += units;
    cell.html(display);
    cell.addClass(fieldLimitsColor(data, data['latest']));
  }
}

function opsConditions(row, cell, data) {
  if ('safe' in data && 'conditions' in data) {
    cell.html(data['safe'] ? 'SAFE' : 'NOT SAFE');
    cell.addClass(data['safe'] ? 'text-success' : 'text-danger');
    opsConditionsTooltip(row, data);
  } else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}

function powerUPS(row, cell, data) {
  const prefix = row.data('prefix');
  const status = getData(data, [prefix + '_status']);
  const load = getData(data, [prefix + '_load']);
  const battery_remaining = getData(data, [prefix + '_battery_remaining']);
  const battery_healthy = getData(data, [prefix + '_battery_healthy']);

  if (battery_healthy === false)
    row.addClass('list-group-item-danger');

  if (status === undefined || battery_remaining === undefined || load === undefined) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    let label = '<span class="text-danger">UNKNOWN</span>';
    if (status === 2) {
      label = '<span class="text-success">ONLINE</span>';
    } else if (status === 3) {
      label = '<span class="text-warning">BATTERY</span>';
    }

    label += ' (' + Math.round(battery_remaining) + '%&nbsp;/&nbsp;' + Math.round(load) + '%)';
    cell.html(label);
  }
}

function powerATS(row, cell, data) {
  let label, style;
  if (data > 0) {
    label = 'SOURCE ' + data;
    style = '';
  } else {
    label = 'ERROR';
    style = 'text-danger';
  }

  cell.html(label);
  cell.addClass(style);
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

function powerOnOffMixed(row, cell, data) {
  const switches = row.data('switches');
  let error = false;
  let enabled = 0;

  for (let i in switches) {
    if (!(switches[i] in data) || data[switches[i]] === 2)
      error = true;
    else if (data[switches[i]] === 1)
      enabled += 1;
  }

  let status = 'POWER MIXED';
  let style = 'text-warning';
  if (error) {
    status = 'ERROR';
    style = 'text-danger';
  } else if (enabled === switches.length) {
    status = 'POWER ON';
    style = 'text-success';
  } else if (enabled === 0) {
    status = 'POWER OFF';
    style = 'text-danger';
  }

  cell.html(status);
  cell.addClass(style);
}

function switchClosedOpen(row, cell, data) {
  if ('latest' in data)
    cell.html(data['latest'] ? 'CLOSED' : 'OPEN');
  else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}

function dehumidifierState(row, cell, data) {
  const mode = getData(data, row.data('mode-index'));
  const powered = getData(data, row.data('power-index'));

  if (mode === undefined || powered === undefined) {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  } else {
    const mode_class = mode === 1 ? 'text-success' : 'text-warning';
    const mode_label = mode === 1 ? 'AUTO' : 'MANUAL';
    const power_class = powered === 1 ? 'text-danger' : 'text-success';
    const power_label = powered === 1 ? 'ON' : 'OFF';
    let label = '<span class="' + mode_class + '">' + mode_label + '</span>&nbsp;/&nbsp;<span class="' + power_class + '">' + power_label + '</span>';
    cell.html(label);
  }
}


function opsDomeTime(row, cell, data) {
  const mode = getData(data, ['mode']);
  const time = getData(data, ['requested_' + row.data('type') + '_date']);

  if (mode === 2) {
    cell.html('MANUAL');
    cell.addClass('text-warning');
  }
  else if (time) {
    cell.html(time);
    cell.addClass('text-success');
  } else {
    cell.html('NOT SCHEDULED');
  }
}

function opsActionsQueue(container, data) {
  const ops_data = getData(data, container.data('index'));
  const schedule = getData(ops_data, ['schedule']);
  const mode = getData(ops_data, ['mode']);

  container.empty();
  if (schedule && schedule.length > 0) {
    function formatList(entries) {
      const parent = $('<ul />');
      $.each(entries, function (i) {
        if (Array.isArray(entries[i]))
          formatList(entries[i]).appendTo(parent);
        else
          $('<li />').text(entries[i]).appendTo(parent);
      });
      return parent;
    }

    const parent = $('<ul />');
    $.each(schedule, function (i) {
      const action = $('<li />').text(schedule[i].name);
      formatList(schedule[i].tasks).appendTo(action);
      action.appendTo(parent);
    });

    container.append(parent);
  } else if (mode === 2) {
    container.append($('<p class="text-center">Telescope mode is <span class="text-warning">MANUAL</span></p>'));
  } else {
    container.append($('<p class="text-center">No actions are scheduled</p>'));
  }
}

function opsActionName(row, cell, data) {
  if (!('mode' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data['mode'] === 2) {
    cell.html('MANUAL');
    cell.addClass('text-warning');
  } else if ('action_name' in data) {
    let label = data['action_name'];
    if ('action_number' in data && data['action_number'] > 0)
      label += ' (' + data['action_number'] + ' / ' + data['action_count'] + ')';
    cell.html(label);
  } else
    cell.html('IDLE');
}

function opsActionTask(row, cell, data) {
  if (!('mode' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data['mode'] === 2) {
    cell.html('MANUAL');
    cell.addClass('text-warning');
  } else if ('action_task' in data)
    cell.html(data['action_task']);
  else
    cell.html('IDLE');
}

function pipelineObject(row, cell, data) {
  if (!('frame_type' in data) || !('frame_object' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data['frame_type'] === 'SCIENCE')
    cell.html(data['frame_object']);
  else
    cell.html(data['frame_type']);
}

function pipelinePrefix(row, cell, data) {
  cell.html(data);
}

function mountState(row, cell, data) {
  const mount_data = getData(data, row.data('mount-index'));
  const powered = getData(data, row.data('power-index'));

  const state = [
    ['DISABLED', 'text-danger'],
    ['PARKED', ''],
    ['STOPPED', 'text-danger'],
    ['SLEWING', 'text-warning'],
    ['TRACKING', 'text-success'],
  ];

  if (!powered) {
    cell.html('POWER OFF');
    cell.addClass('text-danger');
  } else if (mount_data && 'state' in mount_data) {
    if ('axes_homed' in mount_data && !mount_data['axes_homed']) {
      cell.html('NOT HOMED');
      cell.addClass('text-danger');
    } else {
      cell.html(state[mount_data['state']][0]);
      cell.addClass(state[mount_data['state']][1]);
    }
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function mountRADec(row, cell, data) {
  if (data && (('state' in data && (data['state'] < 2 || data['state'] > 4)) || ('axes_homed' in data && !data['axes_homed'])))
    cell.html('N/A')
  else if (!data || !('ra' in data) || !('dec' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else
    cell.html(sexagesimal(data['ra'] / 15) + '&nbsp;/&nbsp;' + sexagesimal(data['dec']));
}

function mountAltAz(row, cell, data) {
  if (data && (('state' in data && (data['state'] < 2 || data['state'] > 4)) || ('axes_homed' in data && !data['axes_homed'])))
    cell.html('N/A')
  else if (!data || !('alt' in data) || !('az' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else
    cell.html((data['alt']).toFixed(1) + '&deg;&nbsp;/&nbsp;' + (data['az']).toFixed(1) + '&deg;');
}

function mountSunMoon(row, cell, data) {
  if (data && (('state' in data && (data['state'] < 2 || data['state'] > 4)) || ('axes_homed' in data && !data['axes_homed'])))
    cell.html('N/A')
  else if (!data || !('sun_separation' in data) || !('moon_separation' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else
    cell.html((data['sun_separation']).toFixed(1) + '&deg;&nbsp;/&nbsp;' + (data['moon_separation']).toFixed(1) + '&deg;');
}

function domeShutter(row, cell, data) {
  const state = [
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

function domeHeartbeat(row, cell, data) {
  const state = [
    ['DISABLED', 'text-warning'],
    ['ACTIVE', 'text-success'],
    ['CLOSING DOME', 'text-danger'],
    ['TRIPPED', 'text-danger'],
    ['UNAVAILABLE', 'text-warning']
  ];

  let label = 'ERROR';
  let style = 'text-danger';

  if ('heartbeat_status' in data && 'heartbeat_remaining' in data) {
    if (data['heartbeat_status'] === 1) {
      label = data['heartbeat_remaining'] + 's remaining';
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

function ashDomeState(row, cell, data) {
  const shutter = getData(data, ["shutter"]);
  const azimuth = getData(data, ["azimuth_status"]);

  const shutter_state = [
    ['DISCONNECTED', 'text-danger'],
    ['CLOSED', 'text-danger'],
    ['OPEN', 'text-success'],
    ['PARTIALLY OPEN', 'text-info'],
    ['OPENING', 'text-warning'],
    ['CLOSING', 'text-warning'],
    ['FORCE CLOSING', 'text-danger']
  ];

  const azimuth_state = [
    ['DISCONNECTED', 'text-danger'],
    ['NOT HOMED', 'text-danger'],
    ['IDLE', ''],
    ['MOVING', 'text-warning'],
    ['HOMING', 'text-warning']
  ];

  if (shutter === undefined || azimuth === undefined) {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  } else if (shutter === 0) {
    cell.html('DISCONNECTED');
    cell.addClass('text-danger');
  } else {
    const s = shutter_state[shutter];
    const a = azimuth_state[azimuth];
    let label = '<span class="' + s[1] + '">' + s[0] + '</span>&nbsp;/&nbsp;<span class="' + a[1] + '">' + a[0] + '</span>';
    cell.html(label);
  }
}

function ashDomeAzimuth(row, cell, data) {
  const azimuth = getData(data, ["azimuth"]);
  const status = getData(data, ["azimuth_status"]);

  if (status !== 2 && status !== 3) {
    cell.html('N/A');
  } else if (azimuth !== undefined) {
    cell.html(azimuth.toFixed(0) + '&deg;');
  } else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}

function ashDomeAzControl(row, cell, data) {
  const follow = getData(data, ["follow_telescope"]);
  const status = getData(data, ["azimuth_status"]);

  if (status === 0 || status === 1) {
    cell.html('N/A');
  } else if (follow) {
    cell.html('AUTO');
    cell.addClass('text-success');
  } else {
    cell.html('MANUAL');
    cell.addClass('text-warning');
  }
}

function ashDomeHeartbeat(row, cell, data) {
  const state = [
    ['DISABLED', 'text-warning'],
    ['ACTIVE', 'text-success'],
    ['CLOSING DOME', 'text-danger'],
    ['TRIPPED', 'text-danger'],
  ];

  const shutter = getData(data, ["shutter"]);
  const status = getData(data, ["heartbeat_status"]);
  const remaining = getData(data, ["heartbeat_remaining"]);

  let label, style;
  if (shutter === 0) {
    label = 'N/A';
    style = '';
  } else if (status === 1 && remaining !== undefined) {
    label = remaining + 's remaining';
      if (data['heartbeat_remaining'] < 30)
        style = 'text-danger'
      else if (remaining < 60)
        style = 'text-warning';
      else
        style = 'text-success';
  } else {
      label = state[status][0];
      style = state[status][1];
  }

  cell.html(label);
  cell.addClass(style);
}

function focusState(row, cell, data) {
  const focuser_data = getData(data, row.data('focuser-index'));
  const powered = getData(data, row.data('power-index'));
  let temperature = undefined;
  if (row.data('temperature-index'))
    temperature = getData(data, row.data('temperature-index'));

  const focuser = row.data('focuser');
  const focuser_suffix = focuser !== undefined ? '_' + focuser : '';
  const status = getData(focuser_data, ['status']);
  const current_steps = getData(focuser_data, ['current_steps' + focuser_suffix]);
  const moving = getData(focuser_data, ['moving' + focuser_suffix]);

  let label, style;
  if (powered === 0) {
    label = 'POWER OFF';
    style = 'text-danger';
  } else if (status === 0) {
    label = 'OFFLINE';
    style = 'text-danger';
  } else if (status === 1 && moving) {
    label = 'MOVING';
    style = 'text-warning';
  } else if (status === 1 && current_steps !== undefined) {
    label = current_steps + ' steps';
    style = '';
  } else {
    label = 'ERROR';
    style = 'text-danger';
  }

  if (temperature !== undefined) {
    label = '<span class="' + style + '">' + label + '</span>&nbsp;/&nbsp;' + temperature.toFixed(1) + '&deg;C';
    style = '';
  }

  cell.html(label);
  cell.addClass(style);
}

function qhyState(row, cell, data) {
  const cam_state = getData(data, row.data('cam-index'));
  const powered = getData(data, row.data('power-index'));

  const state = [
    ['OFFLINE', 'text-danger'],
    ['INITIALIZING', 'text-danger'],
    ['IDLE'],
    ['WAITING', 'text-warning'],
    ['EXPOSING', 'text-success'],
    ['READING', 'text-warning'],
    ['ABORTING', 'text-danger'],
  ];

  let label, style;
  if (cam_state === undefined || powered === undefined) {
    label = 'ERROR';
    style = 'text-danger';
  } else if (powered === 0) {
    label = 'POWER OFF';
    style = 'text-danger';
  } else {
    label = state[cam_state][0];
    style = state[cam_state][1];
  }

  cell.html(label);
  cell.addClass(style);
}

function qhyExposure(row, cell, data) {
  const state = getData(data, ["state"]);
  const exposure = getData(data, ["exposure_time"]);
  let label, style;
  if (state === 0) {
    label = 'N/A';
    style = '';
  } else if (exposure === undefined) {
    label = 'ERROR';
    style = 'text-danger';
  } else {
    label = exposure.toFixed(3) + ' s';
    style = '';
  }

  cell.html(label);
  cell.addClass(style);
}

function qhyReadMode(row, cell, data) {
  const state = getData(data, ["state"]);
  const stream = getData(data, ["stream"]);
  let label, style;
  if (state === 0) {
    label = 'N/A';
    style = '';
  } else if (stream === undefined) {
    label = 'ERROR';
    style = 'text-danger';
  } else {
    label = stream ? 'STREAM' : 'SINGLE';
    style = '';
  }

  cell.html(label);
  cell.addClass(style);
}

function qhyTemperature(row, cell, data) {
  const state = getData(data, ["state"]);
  const temperature = getData(data, ["cooler_temperature"]);
  const cooler_power = getData(data, ["cooler_pwm"]);
  const cooler_mode = getData(data, ["cooler_mode"]);

  const cooler_labels = [
    ['UNKNOWN', 'text-danger'],
    ['WARM', 'text-danger'],
    ['WARMING', 'text-warning'],
    ['COOLING', 'text-info'],
    ['LOCKING', 'text-warning'],
    ['LOCKED', 'text-success'],
  ];

  let label = 'ERROR';
  let style = 'text-danger';
  if (state === 0) {
    label = 'N/A';
    style = '';
  } else if (cooler_power !== undefined && cooler_mode !== undefined && temperature !== undefined) {
    label = '<span class="' + cooler_labels[cooler_mode][1] + '">' + cooler_labels[cooler_mode][0] + '</span>'
    label += ' (' + temperature.toFixed(0) + '&nbsp;&deg;C';
    if (cooler_mode !== 1)
      label += '&nbsp;/&nbsp;' + cooler_power.toFixed(0) + '%';
    label += ')';
    style = '';
  }

  cell.html(label);
  cell.addClass(style);
}

function qhyFilter(row, cell, data) {
  const state = getData(data, ["state"]);
  let label = getData(data, ["filter"]);
  let style = '';
  if (state === 0) {
    label = 'N/A';
  } else if (label === undefined) {
    label = 'ERROR';
    style = 'text-danger';
  }

  cell.html(label);
  cell.addClass(style);
}

function swirState(row, cell, data) {
  // SWIR uses the same state dictionary as QHY
  qhyState(row, cell, data);
}

function swirExposure(row, cell, data) {
  // SWIR uses the same state dictionary as QHY
  qhyExposure(row, cell, data);
}

function swirTemperature(row, cell, data) {
  const state = getData(data, ["state"]);
  const temperature = getData(data, ["sensor_temperature"]);
  const cooler_mode = getData(data, ["cooler_mode"]);

  const cooler_labels = [
    ['UNKNOWN', 'text-danger'],
    ['OFF', 'text-danger'],
    ['LOCKING', 'text-warning'],
    ['LOCKED', 'text-success'],
  ];

  let label = 'ERROR';
  let style = 'text-danger';
  if (state === 0) {
    label = 'N/A';
    style = '';
  } else if (cooler_mode !== undefined && temperature !== undefined) {
    label = '<span class="' + cooler_labels[cooler_mode][1] + '">' + cooler_labels[cooler_mode][0] + '</span>'
    label += ' (' + temperature.toFixed(0) + '&nbsp;&deg;C)';
    style = '';
  }

  cell.html(label);
  cell.addClass(style);
}

function andorState(row, cell, data) {
  const cam_state = getData(data, row.data('cam-index'));
  const powered = getData(data, row.data('power-index'));

  const state = [
    ['OFFLINE', 'text-danger'],
    ['INITIALIZING', 'text-danger'],
    ['IDLE'],
    ['EXPOSING', 'text-success'],
    ['READING', 'text-warning'],
    ['ABORTING', 'text-danger']
  ];

  let label, style;
  if (cam_state === undefined || powered === undefined) {
    label = 'ERROR';
    style = 'text-danger';
  } else if (powered === 0) {
    label = 'POWER OFF';
    style = 'text-danger';
  } else {
    label = state[cam_state][0];
    style = state[cam_state][1];
  }

  cell.html(label);
  cell.addClass(style);
}

function andorCooling(row, cell, data) {
  console.log('here');
  const state = getData(data, ["state"]);
  const temperature = getData(data, ["temperature"]);
  const temperature_locked = getData(data, ["temperature_locked"]);
  const cooler_enabled = getData(data, ["cooler_enabled"]);

  let label = 'ERROR';
  let style = 'text-danger';
  if (state === 0) {
    label = 'N/A';
    style = '';
  } else if (cooler_enabled !== undefined && temperature !== undefined && temperature_locked !== undefined) {
    let cooler_label = !cooler_enabled ? 'OFF' :
      temperature_locked ? 'LOCKED' : 'LOCKING';
    let cooler_style = !cooler_enabled ? 'text-danger' :
      temperature_locked ? 'text-success' : 'text-info';

    label = '<span class="' + cooler_style + '">' + cooler_label + '</span>'
    label += ' (' + temperature.toFixed(0) + '&nbsp;&deg;C)';
    style = '';
  }

  cell.html(label);
  cell.addClass(style);
}

function andorShutter(row, cell, data) {
  const cam_state = getData(data, ["state"]);
  const cam_shutter = getData(data, ["shutter_enabled"]);

  let label, style;
  if (cam_state === 0) {
    label = 'N/A';
    style = '';
  } else if (cam_shutter === undefined) {
    label = 'ERROR';
    style = 'text-danger';
  } else {
    label = cam_shutter ? 'AUTO' : 'DARK';
    style = cam_shutter ? 'text-success' : 'text-danger';
  }

  cell.html(label);
  cell.addClass(style);
}

function andorExposure(row, cell, data) {
  const cam_state = getData(data, ["state"]);
  const cam_exposure = getData(data, ["exposure_time"]);

  let label, style;
  if (cam_state === 0) {
    label = 'N/A';
    style = '';
  } else if (cam_exposure === undefined) {
    label = 'ERROR';
    style = 'text-danger';
  } else {
    label = cam_exposure.toFixed(3) + ' s'
    style = '';
  }

  cell.html(label);
  cell.addClass(style);
}

function cfwFilter(row, cell, data) {
  const filter_data = getData(data, row.data('filter-index'));
  const powered = getData(data, row.data('power-index'));
  const state = getData(filter_data, ["status"]);

  let label = getData(filter_data, ["filter"]);
  let style = '';

  if (powered === 0) {
    label = 'POWER OFF';
    style = 'text-danger';
  } else if (state === 0) {
    label = 'OFFLINE';
    style = 'text-danger';
  } else if (state === 1) {
    label = 'HOMING';
    style = 'text-warning';
  } else if (label === undefined) {
    label = 'ERROR';
    style = 'text-danger';
  }

  cell.html(label);
  cell.addClass(style);
}

function lensTemperature(row, cell, data) {
  if (data === undefined) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    cell.html(data.toFixed(0) + ' &deg;C');
  }
}

function roofBattery(row, cell, data) {
  if (data != null) {
    let display = data.toFixed(2);
    const units = row.data('units');
    if (units)
      display += units;
    cell.html(display);
  } else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}

function roofState(row, cell, data) {
  const state = [
    ['PARTIALLY OPEN', 'text-info'],
    ['CLOSED', 'text-danger'],
    ['OPEN', 'text-success'],
    ['CLOSING', 'text-warning'],
    ['OPENING', 'text-warning'],
  ];

  if (data >= 0 && data < state.length) {
    cell.html(state[data][0]);
    cell.addClass(state[data][1]);
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function roofHeartbeat(row, cell, data) {
  const state = [
    ['DISABLED', 'text-warning'],
    ['ENABLED', 'text-success'],
    ['TRIPPED', 'text-danger'],
  ];

  let status = 'ERROR';
  let style = 'text-danger';

  if ('heartbeat_status' in data && 'heartbeat_remaining' in data) {
    if (data['heartbeat_status'] === 1) {
      status = data['heartbeat_remaining'] + 's remaining';
      if (data['heartbeat_remaining'] < 10)
        style = 'text-danger'
      else if (data['heartbeat_remaining'] < 30)
        style = 'text-warning';
      else
        style = 'text-success';
    } else {
      status = state[data['heartbeat_status']][0];
      style = state[data['heartbeat_status']][1];
    }
  }

  cell.html(status);
  cell.addClass(style);
}

function powerInstrAircon(row, cell, data) {
  let status = 'ERROR';
  let style = 'text-danger';

  if (data && 'enabled' in data) {
    if (data['enabled']) {
      status = 'AUTO';
      style = 'text-success';
    }
    else {
      status = 'DISABLED';
      style = 'text-warning';
    }
  }

  cell.html(status);
  cell.addClass(style);
}

function powerCompAircon(row, cell, data) {
  let status = 'ERROR';
  let style = 'text-danger';

  if (data && 'active' in data) {
    if (data['active'] === 1) {
      status = 'ACTIVE';
      style = 'text-success';
    }
    else {
      status = 'INACTIVE';
      style = 'text-warning';
    }
  }

  cell.html(status);
  cell.addClass(style);
}

function halfmetreMirrorTemperature(row, cell, data) {
  const focuser_data = getData(data, row.data('focuser-index'));
  const powered = getData(data, row.data('power-index'));
  const status = getData(focuser_data, ['status']);
  const pri_temp = getData(focuser_data, ['temperature', 'primary_mirror']);
  const sec_temp = getData(focuser_data, ['temperature', 'secondary_mirror']);

  let label, style;
  if (powered === 0 || status === 0) {
    cell.html('N/A');
  } else if (pri_temp !== undefined && sec_temp !== undefined) {
    cell.html(pri_temp.toFixed(1) + ' &deg;C&nbsp;/&nbsp;' + sec_temp.toFixed(1)+ ' &deg;C');
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function onemetreState(row, cell, data) {
  const state = [
    ['DISABLED', 'text-danger'],
    ['STOPPED', 'text-danger'],
    ['HUNTING', 'text-warning'],
    ['TRACKING', 'text-success'],
    ['SLEWING', 'text-warning'],
    ['HOMING', 'text-warning'],
    ['LIMITING', 'text-warning'],
  ];

  if (data && 'state' in data) {
    if ('axes_homed' in data && !data['axes_homed']) {
      cell.html('NOT HOMED');
      cell.addClass('text-danger');
    } else {
      cell.html(state[data['state']][0]);
      cell.addClass(state[data['state']][1]);
    }
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function onemetreRADec(row, cell, data) {
  if (data && (('state' in data && (data['state'] < 1 || data['state'] > 3)) || ('axes_homed' in data && !data['axes_homed'])))
    cell.html('N/A')
  else if (!data || !('ra' in data) || !('dec' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else
    cell.html(sexagesimal(data['ra'] / 15) + '&nbsp;/&nbsp;' + sexagesimal(data['dec']));
}

function onemetreAltAz(row, cell, data) {
  if (data && (('state' in data && (data['state'] < 1 || data['state'] > 3)) || ('axes_homed' in data && !data['axes_homed'])))
    cell.html('N/A')
  else if (!data || !('alt' in data) || !('az' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else
    cell.html((data['alt']).toFixed(1) + '&deg;&nbsp;/&nbsp;' + (data['az']).toFixed(1) + '&deg;');
}

function onemetreSunMoon(row, cell, data) {
  if (data && (('state' in data && (data['state'] < 1 || data['state'] > 3)) || ('axes_homed' in data && !data['axes_homed'])))
    cell.html('N/A')
  else if (!data || !('sun_separation' in data) || !('moon_separation' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else
    cell.html((data['sun_separation']).toFixed(1) + '&deg;&nbsp;/&nbsp;' + (data['moon_separation']).toFixed(1) + '&deg;');
}

function onemetreFocus(row, cell, data) {
  const state = [
    ['ABSENT', 'text-danger'],
    ['NOT HOMED', 'text-danger'],
    ['HOMING', 'text-warning'],
    ['LIMITING', 'text-warning'],
    ['READY', 'text-success']
  ];

  const tel_state = getData(data, ["state"]);
  const focus_state = getData(data, ["telescope_focus_state"]);
  const focus = getData(data, ["telescope_focus_um"]);

  let label, style;
  if (tel_state === 0) {
    label = 'N/A';
    style = '';
  } else if (focus_state !== undefined && focus_state !== 4) {
    cell.html(state[data['telescope_focus_state']][0]);
    cell.addClass(state[data['telescope_focus_state']][1]);
  } else if (focus !== undefined) {
    cell.html(focus.toFixed(1) + ' um');
  }

  cell.html(label);
  cell.addClass(style);
}

function onemetreRedFocus(row, cell, data) {
  cell.html('N/A');
}

function previewHeader(row, data) {
  row.html('Preview: ' + row.data('cam').toUpperCase());
}

function previewTimestamp(row, cell, data) {
  const cam = row.data('cam');
  const date = getData(data, [cam, 'date']);
  const src = getData(data, [cam, 'src']);
  const gps = row.data('gps');

  if (date === undefined) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    let label = date;
    if (src && gps && gps.includes(cam)) {
      label += ' (<span class="' + (src === 'GPS' ? 'text-success' : 'text-danger') + '">' + src + '</span>)';
    }
    cell.html(label);
  }
}

function previewExposure(row, cell, data) {
  const exptime = getData(data, [row.data('cam'), 'exptime']);
  if (exptime === undefined) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    cell.html(exptime.toFixed(3) + ' s');
  }
}

function previewFilter(row, cell, data) {
  const exptime = getData(data, [row.data('cam'), 'filter']);
  if (exptime === undefined) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    cell.html(exptime);
  }
}

function previewType(row, cell, data) {
  const type = getData(data, [row.data('cam'), 'type']);
  const object = getData(data, [row.data('cam'), 'object']);
  if (type === undefined) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    let label = type;
    if (object) {
      label += ' (' + object + ')';
    }
    cell.html(label);
  }
}

function previewOverheads(row, cell, data) {
  const steps = getData(data, [row.data('cam'), 'process_steps']);
  const time = getData(data, [row.data('cam'), 'process_time']);
  if (steps === undefined || time === undefined) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    cell.html(time.toFixed(1) + ' s (' + steps.join(', ') + ')');
    cell.addClass('d-inline-block text-truncate');
    cell.css('max-width', '230px');
  }
}

function previewFilename(row, cell, data) {
  const cam = row.data('cam');
  const info = getData(data, [cam]);
  let label = 'ERROR';
  let style = 'text-danger';
  if (info && 'saved' in info && !info['saved']) {
    label = 'NOT SAVED';
  } else if (info && 'filename' in info) {
    label = info['filename'];
    style = 'd-inline-block text-truncate';
  }

  cell.html(label);
  cell.addClass(style);
  cell.css('max-width', '250px');
}

function previewImage(img, data) {
  if (data && 'previews' in data) {
    img.data('data', {'previews': data['previews']});
  }
  previewRefresh(img, data);
}

function previewRefresh(img, data) {
  const info = getData(data, ['previews', img.data('cam')]);
  if (info && 'date' in info) {
    let date = parseUTCDate(info['date']).getTime();
    img.attr('src', img.data('url') + '?' + date);
  }
}

function selectPreview(cam) {
  const display = $('#preview-image');
  const data = display.data('data');

  display.data('cam', cam);
  display.data('url', $('#thumb-' + cam).data('url'));

  $('#preview-info [data-cam]').each(function () {
    $(this).data('cam', cam);
  });

  updateGroups(data, '#preview-container');
}
