const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');

describe('API tests', function() {
  this.timeout(10000);

  after(async () => {
    await mongoose.connection.close();
  });

  let createdId;

  it('should create a user', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'John', age: 30 });
    createdId = res.body._id;
    if(res.status !== 201) throw new Error('Create failed');
  });

  it('should update a user', async () => {
    const res = await request(app)
      .put('/users/' + createdId)
      .send({ age: 31 });
    if(res.status !== 200) throw new Error('Update failed');
  });

  it('should delete a user', async () => {
    const res = await request(app)
      .delete('/users/' + createdId);
    if(res.status !== 200) throw new Error('Delete failed');
  });
});
