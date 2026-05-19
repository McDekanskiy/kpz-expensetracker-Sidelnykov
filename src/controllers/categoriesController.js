const { CategoryService } = require('../services/categoryService');
const service = new CategoryService();

function listCategories(req, res, next) {
  try {
    res.json(service.getAll());
  } catch (error) {
    next(error);
  }
}

module.exports = { listCategories };
