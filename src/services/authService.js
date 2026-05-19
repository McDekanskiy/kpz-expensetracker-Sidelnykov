const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ValidationError } = require('../exceptions');

const users = [];
let nextUserId = 1;

class AuthService {
  async register({ email, password, name }) {
    if (!email || !password || password.length < 6) {
      throw new ValidationError('Email and password min 6 chars are required');
    }
    if (users.some((user) => user.email === email)) {
      throw new ValidationError('Email already exists');
    }
    const passwordHash = await bcrypt.hash(password, 8);
    const user = { id: nextUserId++, email, name: name || email, passwordHash };
    users.push(user);
    return { id: user.id, email: user.email, name: user.name };
  }

  async login({ email, password }) {
    const user = users.find((item) => item.email === email);
    if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
      throw new ValidationError('Invalid email or password');
    }
    const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET || 'dev_secret');
    return { token };
  }
}

module.exports = { AuthService };
