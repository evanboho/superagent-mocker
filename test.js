/* global describe, it, before, navigator */

'use strict';

/**
 * Dependencies
 */
var request = require('superagent');
var mock    = require('./')(request);
var should  = require('should');
var noop    = function() {};

describe('superagent mock', function() {

  beforeEach(function() {
    mock.clearRoutes();
    mock.timeout = 0;
  });

  describe('API', function() {

    it('should mock for get', function(done) {
      mock.get('/topics/:id', function(req) {
        req.params.id.should.be.equal('1');
        return { id: req.params.id };
      });
      request.get('/topics/1').end(function(_, data) {
        data.should.have.property('id', '1');
        done();
      });
    });

    it('should mock for post', function(done) {
      mock.post('/topics/:id', function(req) {
        return {
          id: req.params.id,
          content: req.body.content
        };
      });
      request
        .post('/topics/5', { content: 'Hello world' })
        .end(function(_, data) {
          data.should.have.property('id', '5');
          data.should.have.property('content', 'Hello world');
          done();
        })
      ;
    });

    it('should mock for put', function(done) {
      mock.put('/topics/:id', function(req) {
        return { id: req.params.id, content: req.body.content };
      });
      request
        .put('/topics/7', { id: 7, content: 'hello world, bitch!11' })
        .end(function(_, data) {
          data.should.have.property('id', '7');
          data.should.have.property('content', 'hello world, bitch!11');
          done();
        })
      ;
    });

    it('should mock for delete', function(done) {
      mock.del('/topics/:id', function(req) {
        return { id: req.params.id, content: req.body.content };
      });
      request
        .del('/topics/7', { id: 7, content: 'yay' })
        .end(function(_, data) {
          data.should.have.property('id', '7');
          data.should.have.property('content', 'yay');
          done(); // just done
        })
      ;
    });

    it('should be async', function(done) {
      var isAsync = true;
      mock.get('/async', function(req) {
        isAsync = false;
      });
      request
        .get('/async')
        .end()
      ;
      isAsync.should.be.true;
      done();
    });

    it('should work correct with unmocked requests', function(done) {
      request
        .get('http://example.com')
        .end(function(err, res) {
          done(err);
        });
    });

    it('should work with custom timeout', function(done) {
      var startedAt = +new Date();
      mock.timeout = 100;
      mock.get('/timeout', noop);
      request
        .get('/timeout')
        .end(function(err, res) {
          var finishedAt = +new Date();
          var offset = finishedAt - startedAt;
          offset.should.be.above(mock.timeout - 1);
          done(err);
        });
    });

    it('should work with custom timeout function', function(done) {
      var startedAt = +new Date();
      mock.get('/timeout', noop);
      mock.timeout = function () { return 200; };
      request
        .get('/timeout')
        .end(function(err, res) {
          var finishedAt = +new Date();
          var offset = finishedAt - startedAt;
          offset.should.be.above(199);
          done(err);
        });
    });

    it('should clear registered routes', function(done) {
      mock.get('/topics', noop);
      mock.clearRoutes();
      request
        .get('/topics')
        .end(function(err, res) {
          should.throws(function() {
            should.ifError(err);
          }, /ECONNREFUSED/);
          done();
        });
    });

    it('should provide error when method throws', function(done) {
      var error = Error('This should be in the callback!');
      mock.get('http://example.com', function(req) {
        throw error;
      });
      request
        .get('http://example.com')
        .end(function(err, res) {
          err.should.equal(error);
          done();
        });
    });

    it('should support headers', function(done) {
      mock.get('/topics/:id', function(req) {
        return req.headers;
      });
      request.get('/topics/1')
        .set('My-Header', 'my-Value')
        .set('User-Agent', 'Opera Mini')
        .end(function(_, data) {
          // lowercase
          data.should.have.property('my-header', 'my-Value')
          data.should.have.property('user-agent', 'Opera Mini')
          done();
        })
      ;
    });

    it('should pass data from send()', function(done) {
      mock.post('/topics/:id', function(req) {
        return req.body;
      });
      request
        .post('/topics/5')
        .send({ content: 'Hello world' })
        .end(function(_, data) {
          data.should.have.property('content', 'Hello world');
          done();
        })
      ;
    });

    it('should rewrite post() data by send()', function(done) {
      mock.post('/topics/:id', function(req) {
        return req.body;
      });
      request
        .post('/topics/5', { content: 'Hello Universe'})
        .send({ content: 'Hello world', title: 'Yay!' })
        .end(function(_, data) {
          data.should.have.property('title', 'Yay!');
          data.should.have.property('content', 'Hello world');
          done();
        })
      ;
    });

  });

});
