const core = require('@actions/core');
const https = require('https');
const Table = require('cli-table');

try {
  const url = core.getInput('url');
  const sonarqubeToken = core.getInput('login');
  console.log(`Getting results from: ${url}...`);

  const options = {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${sonarqubeToken}:`).toString('base64'),
    }
  };
  https.get(url, options, response => {
    let data = '';

    response.on('data', chunk => {
      data += chunk;
    });
    response.on('end', () => {
      const payload = JSON.parse(data);
      if (payload.projectStatus.status === "ERROR") {
        const table = new Table({
          head: ['metric key', 'comparator', 'period index', 'error threshold', 'actual value'],
        });

        payload.projectStatus.conditions
          .filter(record => record.status === 'ERROR')
          .forEach(record => {
            table.push([
              record.metricKey,
              record.comparator,
              record.periodIndex,
              record.errorThreshold,
              record.actualValue,
            ]);
          });

        const result = table.toString();
        console.log(result);
        core.setFailed(result);
      } else {
        console.log('Everything ok!')
      }
    });
  }).on('error', err => {
    core.setFailed(err.message);
  });
} catch (error) {
  core.setFailed(error.message);
}
