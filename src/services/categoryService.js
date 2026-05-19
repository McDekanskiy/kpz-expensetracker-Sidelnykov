const { CategoryRepository } = require('../repositories/categoryRepository');

class CategoryService {
  constructor(repository = new CategoryRepository()) {
    this.repository = repository;
  }

  getAll() {
    return this.repository.findAll();
  }
}

module.exports = { CategoryService };
