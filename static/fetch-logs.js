let last_message_id = 0;
let current_date = '';

function updateLog(messages) {
  const table = $('#log-table');
  if (messages) {
    const length = messages.length;
    const tbody = $('#log-table tbody');

    // First row is always the current date
    tbody.children().first().remove();

    for (let i = 0; i < length; i++) {
      const message = messages[length - i - 1];
      const row = $('<tr>');

      let message_date = message[1].substr(0, 10);
      if (message_date !== current_date && current_date) {
        table.prepend($('<tr style="border-width: 1px 0 1px 0; border-style: solid; border-color: var(--bs-border-color);"><td colspan="3" class="text-center fw-bold">' + current_date + '</td>'));
      }

      if (message[2] === 'warning')
        row.addClass('text-warning');

      if (message[2] === 'error')
        row.addClass('text-danger');

      row.append($('<td class="align-top pe-1">').html('<abbr title="' + message_date + '" class="text-decoration-none">' + message[1].substr(message[1].length - 8) + '</abbr>'));
      row.append($('<td class="align-top pe-1">').text(message[3]));
      row.append($('<td class="text-wrap">').text(message[4]));

      table.prepend(row);
      last_message_id = message[0];
      current_date = message_date;
    }

    table.prepend($('<tr style="border-bottom: 1px solid var(--bs-border-color)"><td colspan="3" class="text-center fw-bold">' + current_date + '</td>'));

    // Remove excess rows as new messages arrive
    while (tbody.children().length > 250)
      tbody.children().last().remove();
  } else {
    table.children().remove();
    table.prepend($('<tr><td class="text-center pt-2">Failed to query log</td>'));
    last_message_id = 0;
    current_date = undefined;
  }
}

function pollLog(logURL) {
  let localURL = logURL;
  if (last_message_id > 0)
    localURL += '?from=' + last_message_id;

  $.ajax({
    type: 'GET',
    dataType: 'json',
    url: localURL,
    statusCode: {
      404: function () {
        updateLog(null);
      },
      500: function () {
        updateLog(null);
      },
    }
  }).done(function (data) {
    updateLog(data['messages']);
  });

  window.setTimeout(function () {
    pollLog(logURL);
  }, 10000);
}
