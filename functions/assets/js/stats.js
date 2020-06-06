/**
 * The `vdrData` object on `window` has the following structure:
 *
 * {
 *   totals: {
 *     declarations: number;
 *     verifications: number;
 *   };
 *   records: DelarationRecord[];
 * }
 *
 * where `DelarationRecord` has the following structure:
 *
 * {
 *   createdAt: number;
 *   verifiedAt: number;
 *   verified: boolean;
 * }
 *
 * Bothe `createdAt` and `verifiedAt` are timestamps.
 */

(function render(win, doc) {
  var totalDeclarations = '#total-declarations';
  var totalVerifications = '#total-verifications';
  var developmentChart = '#development-chart';
  var actionMonthly = '#monthly';
  var actionLastThirtyDays = '#last-thirty-days';
  var actionLastSevenDays = '#last-seven-days';
  var actionsGroup = '.btn-group';

  function renderTotals(totals) {
    doc.querySelector(totalDeclarations).innerHTML = totals.declarations;
    doc.querySelector(totalVerifications).innerHTML = totals.verifications;
  }

  function updateActionsState(activeAction) {
    doc.querySelector(actionsGroup).querySelectorAll('button').forEach(btn => btn.removeAttribute('disabled'));
    doc.querySelector(activeAction).setAttribute('disabled', true);
  }

  function mapObjectToDataset(obj) {
    var labels = Object.keys(obj);
    var data = labels.map(function (key) {
      return obj[key];
    });

    return { labels: labels, data: data };
  }

  function calcMonthlyDataset(records) {
    var result = (records || []).reduce(function (dataset, record) {
      var d = new Date(record.createdAt);
      var label = (d.getUTCMonth() + 1) + '-' + d.getUTCFullYear();
      dataset[label] = dataset[label] ? dataset[label] + 1 : 1;

      return dataset;
    }, {});

    return mapObjectToDataset(result);
  }

  function calcLastThirtyDaysDataset(records) {
    var thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    var result = (records || [])
      .filter(function (record) { return record.createdAt >= thirtyDaysAgo })
      .reduce(function (dataset, record) {
        var d = new Date(record.createdAt);
        var label = d.getUTCDate() + '-' + (d.getUTCMonth() + 1);
        dataset[label] = dataset[label] ? dataset[label] + 1 : 1;

        return dataset;
      }, {});

    return mapObjectToDataset(result);
  }

  function calcLastSevenDaysDataset(records) {
    var sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    var result = (records || [])
      .filter(function (record) { return record.createdAt >= sevenDaysAgo })
      .reduce(function (dataset, record) {
        var d = new Date(record.createdAt);
        var label = d.getUTCDate() + '-' + (d.getUTCMonth() + 1);
        dataset[label] = dataset[label] ? dataset[label] + 1 : 1;

        return dataset;
      }, {});

    return mapObjectToDataset(result);
  }

  function renderChart(labels, dataset, ctx) {
    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [dataset]
      },
    });
  }

  function renderMonthlyChart(labels, data, ctx) {
    const dataset = {
      label: 'Månedlig udvikling',
      data: data,
      borderColor: 'rgba(0, 123, 255, 1)',
      backgroundColor: 'rgba(0, 123, 255, 0.2)',
    };
    renderChart(labels, dataset, ctx);
  }

  function renderLastThirtyDaysChart(labels, data, ctx) {
    const dataset = {
      label: 'Sidste 30 dage',
      data: data,
      borderColor: 'rgba(0, 123, 255, 1)',
      backgroundColor: 'rgba(0, 123, 255, 0.2)',
    };
    renderChart(labels, dataset, ctx);
  }

  function renderLastSevenDaysChart(labels, data, ctx) {
    const dataset = {
      label: 'Sidste 7 dage',
      data: data,
      borderColor: 'rgba(0, 123, 255, 1)',
      backgroundColor: 'rgba(0, 123, 255, 0.2)',
    };
    renderChart(labels, dataset, ctx);
  }

  win.addEventListener('load', function () {
    console.log('Rendering...');
    renderTotals(win['vdrData'].totals);

    var ctx = doc.querySelector(developmentChart).getContext('2d');

    var monthly = calcMonthlyDataset(win['vdrData'].records);
    console.log('Monthly Data:', monthly);
    renderMonthlyChart(monthly.labels, monthly.data, ctx);

    var lastThirtyDays = calcLastThirtyDaysDataset(win['vdrData'].records);
    console.log('Last 30 Days Data:', lastThirtyDays);

    var lastSevenDays = calcLastSevenDaysDataset(win['vdrData'].records);
    console.log('Last 7 Days Data:', lastSevenDays);

    doc.querySelector(actionMonthly).addEventListener('click', function () {
      renderMonthlyChart(monthly.labels, monthly.data, ctx);
      updateActionsState(actionMonthly);
    });

    doc.querySelector(actionLastThirtyDays).addEventListener('click', function () {
      renderLastThirtyDaysChart(lastThirtyDays.labels, lastThirtyDays.data, ctx);
      updateActionsState(actionLastThirtyDays);
    });

    doc.querySelector(actionLastSevenDays).addEventListener('click', function () {
      renderLastSevenDaysChart(lastSevenDays.labels, lastSevenDays.data, ctx);
      updateActionsState(actionLastSevenDays);
    });
  });
})(window, document);
