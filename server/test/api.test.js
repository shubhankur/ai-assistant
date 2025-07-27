const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;

before(async function() {
  this.timeout(10000);
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  app = require('../index');
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

let userId;
let planId;

describe('User API', () => {
  it('creates a user', async () => {
    const res = await request(app).post('/users').send({ name: 'Alice', email: 'a@test.com', phone: '123' });
    userId = res.body._id;
    if (res.status !== 201) throw new Error('Create failed');
  });

  it('gets user by id', async () => {
    const res = await request(app).get('/users/' + userId);
    if (res.body._id !== userId) throw new Error('Get by id failed');
  });

  it('gets user by email', async () => {
    const res = await request(app).get('/users/email/a@test.com');
    if (res.body._id !== userId) throw new Error('Get by email failed');
  });
});

describe('DailyPlan API', () => {
  it('creates a daily plan', async () => {
    const res = await request(app).post('/dailyPlans').send({ userid: userId, date: '2024-01-01' });
    planId = res.body._id;
    if (res.status !== 201) throw new Error('Plan create failed');
  });

  it('gets plan by id', async () => {
    const res = await request(app).get('/dailyPlans/' + planId);
    if (res.body._id !== planId) throw new Error('Plan get by id failed');
  });

  it('gets plan by user', async () => {
    const res = await request(app).get('/dailyPlans/user/' + userId);
    if (!Array.isArray(res.body) || res.body[0]._id !== planId) throw new Error('Plan get by user failed');
  });

  it('deletes plan', async () => {
    const res = await request(app).delete('/dailyPlans/' + planId);
    if (res.status !== 200) throw new Error('Plan delete failed');
  });
});

it('deletes user', async () => {
  const res = await request(app).delete('/users/' + userId);
  if (res.status !== 200) throw new Error('User delete failed');
});
