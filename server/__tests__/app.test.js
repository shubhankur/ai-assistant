const request = require('supertest');
const mongoose = require('mongoose');
let server;

describe('CRUD API tests', () => {
  beforeAll(() => {
    server = require('../index');
  });

  afterAll(async () => {
    await mongoose.connection.close();
    server.close();
  });

  test('create user', async () => {
    const res = await request(server).post('/users').send({ name: 'John', age: 30 });
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('John');
  });
});
