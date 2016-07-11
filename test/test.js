var assert = require('chai').assert;
var request = require('supertest');

var url = 'http://localhost:8000/api';

var person1 = {};
var person2 = {};

describe('User Tests', function() {
  describe('Creating a User', function() {

    it('should give correct error message and 422 status when username is missing', function(done) {
      request(url)
        .post('/user')
        .send({'password' : 'Password1'})
        .end(function(err, res){
          assert.equal(res.status, 422);
          assert.equal(res.body.message, 'Username is Required');
          done();
        });
    });

    it('should give correct error message and 422 status when password is missing', function(done) {
      request(url)
        .post('/user')
        .send({'username' : 'UserName1'})
        .end(function(err, res){
          assert.equal(res.status, 422);
          assert.equal(res.body.message, 'Password is Required');
          done();
        });
    });

    it('should respond with json of username, encrypted password and authorization token with 200 status', function(done) {
      request(url)
        .post('/user')
        .send({'username' : 'UserName1', 'password' : 'Password1'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.user.username, 'UserName1');
          assert.notEqual(res.body.user.password, 'Password1');
          assert.notEqual(res.body.token, '');
          person1 = res.body;
          done();
        });
    });

    it('should give correct error message and 422 status when username is in use', function(done) {
      request(url)
        .post('/user')
        .send({'username' : 'UserName1', 'password' : 'Password1'})
        .end(function(err, res){
          assert.equal(res.status, 422);
          assert.equal(res.body.message, 'Username is in use');
          done();
        });
    });

    it('should create a second user and a unique token', function(done) {
      request(url)
        .post('/user')
        .send({'username' : 'UserName2', 'password' : 'Password2'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.user.username, 'UserName2');
          assert.notEqual(res.body.user.password, 'Password2');
          assert.notEqual(res.body.token, '');
          assert.notEqual(res.body.token, person1.token);
          person2 = res.body;
          done();
        });
    });
  });

  describe('Deleting a User', function() {
    it('should give correct error message and 400 status when no auth token is found', function(done) {
      request(url)
        .del('/user/' + person1.user.id)
        .end(function(err, res){
          assert.equal(res.status, 400);
          assert.equal(res.body.message, 'No Authorization header was found');
          done();
        });
    });

    it('should give correct error message and 400 status when auth header is not formatted', function(done) {
      request(url)
        .del('/user/' + person1.user.id)
        .set('Authorization', 'asdf')
        .end(function(err, res){
          assert.equal(res.status, 400);
          assert.equal(res.body.message, 'Format is Authorization: Bearer [token]');
          done();
        });
    });

    it('should give correct error message and 401 status when token is not for current user', function(done) {
      request(url)
        .del('/user/' + person1.user.id)
        .set('Authorization', 'Bearer ' + person2.token)
        .end(function(err, res){
          assert.equal(res.status, 401);
          assert.equal(res.body.message, 'You are not allowed to do that');
          done();
        });
    });

    it('should return a 200 status and delete the person1', function(done) {
      request(url)
        .del('/user/' + person1.user.id)
        .set('Authorization', 'Bearer ' + person1.token)
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.message, 'User Deleted');
          done();
        });
    });

    it('should return a 200 status and delete the person2', function(done) {
      request(url)
        .del('/user/' + person2.user.id)
        .set('Authorization', 'Bearer ' + person2.token)
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.message, 'User Deleted');
          done();
        });
    });

    it('should return a 200 status and verify that no persons are in the db', function(done) {
      request(url)
        .get('/user')
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(Object.keys(res.body).length, 0);
          done();
        });
    });
  });
});