async function generateReportAsync(reportService, filters = {}) {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return reportService.summary(filters);
}

async function generateManyReports(reportService, filtersList) {
  return Promise.all(filtersList.map((filters) => generateReportAsync(reportService, filters)));
}

module.exports = { generateReportAsync, generateManyReports };
