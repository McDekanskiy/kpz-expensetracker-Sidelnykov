const categories = [
  { id: 1, name: 'Food' },
  { id: 2, name: 'Transport' },
  { id: 3, name: 'Health' },
  { id: 4, name: 'Education' }
];

class CategoryRepository {
  findAll() {
    return categories;
  }
}

module.exports = { CategoryRepository };
