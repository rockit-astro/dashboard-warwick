let data = {};


function formatUTCDate(date) {
  let d = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
    date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()];

  for (let i = 0; i < d.length; i++)
    if (d[i] < 10)
      d[i] = '0' + d[i];

  return d[0] + '-' + d[1] + '-' + d[2] + ' ' + d[3] + ':' + d[4] + ':' + d[5];
}


function colorSeriesLabel(label, series) {
  return '<span style="color: ' + series.color + '">' + label + '</span>';
}

function redrawPlot() {
  if (!data.data)
    return;

  let d = [];
  const plot = $(this);

  let axis = 0;
  if (plot.data('column') === 'right')
    axis = 1;

  const type = plot.data('type');
  let range = [undefined, undefined];
  for (let sensor_name in data.data[type]) {
    const sensor = data.data[type][sensor_name];
    if (sensor) {
      d.push(sensor);
      range[0] = range[0] !== undefined ? Math.min(range[0], sensor['min']) : sensor['min'];
      range[1] = range[1] !== undefined ? Math.max(range[1], sensor['max']) : sensor['max'];
    }
  }

  let no_data = false;
  if (d.length === 0) {
    no_data = true;
    d.push({
      'color': 'red',
      'label': 'NO DATA',
      'data': []
    })
  }

  let regenerateLinkedPlots = function (plot, options) {
    let regenerateBindings = true;
    window.setTimeout(function () {
      if (!regenerateBindings)
        return;

      let plots = {};
      let getPlot = function (id) {
        return plots[id];
      };

      $('.weather-plot').each(function () {
        plots[$(this).attr('id')] = $(this).data('plot');
      });

      // Link the plot hover together only after all plots have been created
      for (let key in plots) {
        let plot = plots[key];
        let linkedPlots = plot.getPlaceholder().data('linkedplots');
        if (linkedPlots !== undefined)
          plot.getOptions().linkedplots = linkedPlots.map(getPlot);
      }

      regenerateBindings = false;
    });
  }

  let options = {
    series: {shadowSize: 0},
    axisLabels: {show: true},
    xaxis: {mode: 'time', minTickSize: [1, 'minute'], timeformat: '', min: data.start, max: data.end},
    grid: {
      margin: {left: axis === 0 ? 0 : 15, top: 0, right: axis === 1 ? 0 : 15, bottom: 0},
      hoverable: true,
      autoHighlight: false
    },
    crosshair: {mode: "x", color: '#545454'},
    yaxis: {axisLabel: plot.data('axislabel'), axisLabelPadding: 9, labelWidth: 20},
    legend: {
      noColumns: 6,
      units: plot.data('labelunits'),
      backgroundColor: '#252830',
      backgroundOpacity: 0.5,
      margin: 1,
      labelFormatter: colorSeriesLabel
    },
    linkedplots: [],
    hooks: {bindEvents: bindHoverHooks, processOptions: regenerateLinkedPlots}
  };

  if (plot.data('points') !== undefined) {
    options.lines = {show: false};
    options.points = {show: true, fill: 1, radius: 2, lineWidth: 0, fillColor: false};
  } else {
    options.lines = {show: true, lineWidth: 1};
    options.points = {show: false};
  }

  if (plot.data('ydecimals') !== undefined)
    options.yaxis.tickDecimals = plot.data('ydecimals');

  if (plot.data('labelfudge') !== undefined)
    options.yaxis.labelFudge = plot.data('labelfudge');

  if (plot.data('min') !== undefined && !no_data)
    options.yaxis.min = plot.data('min');

  if (plot.data('max') !== undefined && !no_data)
    options.yaxis.max = plot.data('max');
  else
    options.yaxis.max = range[0] + 1.5 * (range[1] - range[0]);

  if (no_data)
    options.crosshair.mode = null;

  if (axis === 1)
    options.yaxis.position = 'right';

  if (plot.data('hidetime') === undefined) {
    options.xaxis.timeformat = '%H:%M';
    options.xaxis.axisLabel = 'UTC Time';
  }

  return $.plot(this, d, options);
}

function setHoverXPosition(plot, offsetX) {
  let axes = plot.getAxes();
  let offset = plot.getPlotOffset();
  let dataset = plot.getData();
  let options = plot.getOptions();
  let legend = plot.getPlaceholder().find('.legendLabel :first-child');

  let start = axes.xaxis.p2c(axes.xaxis.min);
  let end = axes.xaxis.p2c(axes.xaxis.max);
  let fractionalPos = (offsetX - offset.left) / (end - start);

  if (fractionalPos < 0 || fractionalPos > 1) {
    // Clear labels
    for (let i = 0; i < dataset.length; i++)
      $(legend.eq(i)).html(dataset[i].label);

    // Clear crosshair
    plot.setCrosshair();
    return;
  }

  let x = axes.xaxis.min + (axes.xaxis.max - axes.xaxis.min) * fractionalPos;
  plot.setCrosshair({x: x});
  for (let i = 0; i < dataset.length; i++) {
    let series = dataset[i];

    let j = 0;
    for (; j < series.data.length; j++)
      if (series.data[j] !== null && series.data[j][0] > x)
        break;

    let p1 = series.data[j - 1];
    let p2 = series.data[j];
    if (p1 != null && p2 != null) {
      let y = (p1[1] + (p2[1] - p1[1]) * (x - p1[0]) / (p2[0] - p1[0])).toFixed(2);
      $(legend.eq(i)).text(y + options.legend.units);
    } else
      $(legend.eq(i)).html(dataset[i].label);
  }
}

function bindHoverHooks(plot, eventHolder) {
  let options = plot.getOptions();

  eventHolder.mousemove(function (e) {
    setHoverXPosition(plot, e.offsetX);
    for (let i = 0; i < options.linkedplots.length; i++)
      setHoverXPosition(options.linkedplots[i], e.offsetX);
  });

  eventHolder.mouseout(function (_) {
    setHoverXPosition(plot, -1);
    for (let i = 0; i < options.linkedplots.length; i++)
      setHoverXPosition(options.linkedplots[i], -1);
  });
}

function redrawWindPlot() {
  let plot = $(this);

  const type = plot.data('type');
  let max = undefined;
  let d = []
  for (let sensor_name in data.data[type]) {
    const sensor = data.data[type][sensor_name];
    d.push(sensor);
    max = max !== undefined ? Math.max(max, sensor['max']) : sensor['max'];
  }

  if (d.length === 0) {
    d.push({
      'color': 'red',
      'label': 'NO DATA',
      'data': []
    })
  }

  let maxRadius = 1.1 * Math.max(max, 15 / 1.1);

  function drawPoints(plot, ctx) {
    let axes = plot.getAxes();
    let offset = plot.getPlotOffset();

    // Clip to plot area to prevent overdraw
    let plotWidth = ctx.canvas.width - offset.right - offset.left;
    let plotHeight = ctx.canvas.height - offset.top - offset.bottom;
    let yScale = 1 / maxRadius;
    let xScale = yScale * plotHeight / plotWidth;

    ctx.save();
    ctx.rect(offset.left, offset.top, plot.width(), plot.height());
    ctx.clip();

    // Background axes
    let dl = offset.left + axes.xaxis.p2c(-maxRadius * xScale);
    let dt = offset.top + axes.yaxis.p2c(maxRadius * yScale);
    let dr = offset.left + axes.xaxis.p2c(maxRadius * xScale);
    let db = offset.top + axes.yaxis.p2c(-maxRadius * yScale);

    let hCenter = offset.left + axes.xaxis.p2c(0);
    let vCenter = offset.top + axes.yaxis.p2c(0);

    ctx.strokeStyle = '#545454';

    ctx.beginPath();
    ctx.moveTo(offset.left, vCenter);
    ctx.lineTo(offset.left + plotWidth, vCenter);
    ctx.moveTo(hCenter, offset.top);
    ctx.lineTo(hCenter, offset.top + plotHeight);
    ctx.stroke();

    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.moveTo(dl, dt);
    ctx.lineTo(dr, db);
    ctx.moveTo(dr, dt);
    ctx.lineTo(dl, db);
    ctx.stroke();

    // Background radial curves and tick labels
    $('#wind-plot .wind-labels').remove();
    let wind_plot = $('#wind-plot');
    for (let r = 0; r < maxRadius * 1.414 * plotWidth / plotHeight; r += 10) {
      let cr = axes.yaxis.p2c(-yScale * r) - axes.yaxis.p2c(0);

      if (r > 0) {
        ctx.beginPath();
        ctx.arc(hCenter, vCenter, cr, 0, 2 * Math.PI, true);
        ctx.stroke();
      }

      if (r * xScale < 0.975) {
        let label = r === 0 ? '&nbsp;&nbsp;&nbsp;' + r : r;
        let o = plot.pointOffset({x: r * xScale, y: 0});
        wind_plot.append('<div style="position:absolute;left:' + (o.left - 10) + 'px;top:' + o.top + 'px;font-size:smaller;width:20px" class="wind-labels axisLabels">' + label + '</div>');
        if (r > 0) {
          o = plot.pointOffset({x: -r * xScale, y: 0});
          wind_plot.append('<div style="position:absolute;left:' + (o.left - 10) + 'px;top:' + o.top + 'px;font-size:smaller;width:20px" class="wind-labels axisLabels">' + label + '</div>');
        }
      }
    }

    // Background compass indicators
    let labelHCenter = offset.left + plot.width() / 2;
    let labelVCenter = offset.top + plot.height() / 2;
    let labelPlotWidth = plot.width();
    let labelPlotHeight = plot.height();
    wind_plot.append('<div style="left:' + (labelHCenter - 17) + 'px;top:' + (offset.top - 1) + 'px;" class="wind-labels axisLabels">N</div>');
    wind_plot.append('<div style="left:' + (offset.left + labelPlotWidth - 17) + 'px;top:' + (labelVCenter - 17) + 'px;" class="wind-labels axisLabels">E</div>');
    wind_plot.append('<div style="left:' + (labelHCenter - 17) + 'px;top:' + (offset.top + labelPlotHeight - 17) + 'px;" class="wind-labels axisLabels">S</div>');
    wind_plot.append('<div style="left:' + offset.left + 'px;top:' + (labelVCenter - 17) + 'px;" class="wind-labels axisLabels">W</div>');

    // Historical data is drawn with constant opacity
    // This will be adjusted per-point if we are drawing live data
    ctx.globalAlpha = 0.4;

    // Data points
    let series = plot.getData();
    for (let i = 0; i < series.length; i++) {
      let s = series[i];
      let r = s.points.radius;
      ctx.fillStyle = s.color;

      for (let j = s.data.length - 1; j >= 0; j--) {
        let x = offset.left + axes.xaxis.p2c(xScale * s.data[j][1]);
        let y = offset.top + axes.yaxis.p2c(yScale * s.data[j][2]);

        // Opacity scales from full at 0 age to 1 at 1 hour, then stays constant
        if (!datepicker.getDate())
          ctx.globalAlpha = Math.min(Math.max(0.1, 1 - (data.end - s.data[j][0]) / 3600000), 1);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI, true);
        ctx.fill();
      }
    }

    // Add a border around the most recent point
    ctx.globalAlpha = 1.0;

    if (!datepicker.getDate()) {
      ctx.strokeStyle = '#fff';
      for (let i = 0; i < series.length; i++) {
        let s = series[i];
        let x = offset.left + axes.xaxis.p2c(xScale * s.data[0][1]);
        let y = offset.top + axes.yaxis.p2c(yScale * s.data[0][2]);

        ctx.beginPath();
        ctx.arc(x, y, s.points.radius, 0, 2 * Math.PI, true);
        ctx.stroke();
      }
    }

    // HACK: restoring the context appears to invert the clipping area for the last drawing operation,
    // so we create a throwaway empty path to make sure our actual drawing is not affected
    ctx.beginPath();
    ctx.closePath();
    ctx.restore();
  }

  let axis = 0;
  if (plot.data('column') === 'right')
    axis = 1;

  let options = {
    lines: {show: false},
    xaxis: {min: -1, max: 1, tickLength: 0, axisLabel: '&nbsp;', axisLabelPadding: 0, ticks: []},
    yaxis: {min: -1, max: 1, tickLength: 0, axisLabel: 'Wind (km/h)', axisLabelPadding: 29, ticks: []},
    legend: {
      noColumns: 0,
      backgroundColor: '#252830',
      backgroundOpacity: 0.5,
      margin: 1,
      labelFormatter: colorSeriesLabel
    },
    grid: {
      margin: {left: axis === 0 ? 0 : 15, top: 0, right: axis === 1 ? 0 : 15, bottom: 0},
      hoverable: true,
      autoHighlight: false
    },
    points: {show: false},
    hooks: {draw: [drawPoints]},
  };

  if (axis === 1)
    options.yaxis.position = 'right';

  $.plot(this, d, options);
}

let queryUpdate;
let datepicker = null;

function queryData() {
  // Clear a queued refresh if this was triggered manually
  if (queryUpdate)
    window.clearTimeout(queryUpdate);

  let url = dataURL;
  let dateString = "";
  if (datepicker) {
    dateString = datepicker.getDate('yyyy-mm-dd');
    if (dateString) {
      url += '?date=' + dateString;
    }
  }

  $('#data-updated').text('Loading...');

  $.ajax({
    url: url,
    type: 'GET',
    dataType: 'json',
    success: function (json) {
      data = json;

      $('.weather-plot').each(redrawPlot);
      $('.wind-plot').each(redrawWindPlot);

      if (dateString)
        $('#data-updated').text('Archived data for night of ' + dateString);
      else
        $('#data-updated').text('Live data (updated ' + formatUTCDate(new Date(data.end)) + ' UTC)');
    }
  });

  // Refresh live data every 30 seconds
  if (!dateString)
    queryUpdate = window.setTimeout(queryData, 30000);
}

function setup() {
  let init = true;

  // Automatically switch label side based on column layout
  $('.weather-plot').each(function() {
    let plot = $(this);
    let redraw = $(this).attr('id') === 'wind-plot' ? redrawWindPlot : redrawPlot;
    let sensor = $(this).data('sidesensor');
    if (!sensor)
      return;

    let onResize = function() {
      let offset = $('#'+sensor)[0].offsetTop;
      let updated = false;
      if (offset > 500 && plot.data('column') !== 'left') {
        plot.data('column', 'left');
        updated = true;
      }
      else if (offset < 500 && plot.data('column') !== 'right') {
        plot.data('column', 'right');
        updated = true;
      }

      if (updated && !init)
        window.setTimeout(function() { plot.each(redraw) }, 0);
    };

    $(this).resize(onResize);
    onResize();
  });

  const dp = document.getElementById("datepicker");
  if (dp !== undefined) {
    datepicker = new Datepicker(dp, {
      format: 'yyyy-mm-dd',
      autoclose: true,
      clearButton: true,
      minDate: '2023-07-11',
      maxView: 1,
      maxDate: new Date(),
      buttonClass: 'btn',
    });

    datepicker.element.addEventListener('changeDate', _ => queryData());

    let incrementDate = function(increment) {
      let dateString = datepicker.getDate('yyyy-mm-dd');
      if (dateString) {
        let date = new Date(dateString)
        date.setUTCDate(date.getUTCDate() + increment);
        datepicker.setDate(date);
      } else {
        // Change from Live to today
        let date = new Date()
        date.setHours(date.getHours() - 12);
        datepicker.setDate(date.toISOString().substr(0, 10))
      }

      queryData();
    }

    $('#prev-date').click(function() { incrementDate(-1); });
    $('#next-date').click(function() { incrementDate(+1); });
  }

  init = false;
  queryData();
}
