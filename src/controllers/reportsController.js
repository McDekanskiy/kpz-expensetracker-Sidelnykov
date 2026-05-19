const { ReportService } = require('../services/reportService');
const service = new ReportService();

function getSummary(req, res, next) {
  try {
    res.json(service.summary(req.query));
  } catch (error) {
    next(error);
  }
}

module.exports = { getSummary };
