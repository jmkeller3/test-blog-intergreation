'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config')

chai.use(chaiHttp);

function seedBlogPostData() {
    console.info('seeding blogpost data');
    const seedData = [];

    for (let i=1; i<10; i++) {
        seedData.push(generateBlogPostData)
    }
    return BlogPost.insertMany(seedData);
}

function generateAuthor() {
    return {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName()
    }
}



function generateBlogPostData() {
    return {
        author: generateAuthor(),
        title: faker.name.title(),
        content: faker.lorem.paragraph(),
        created: faker.date.past()
    }
}

function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('BlogPost API resource', function() {
    before(function() {
        return runServer(TEST_DATABASE_URL);
    });

    beforeEach(function() {
        return seedBlogPostData();
    });

    afterEach(function() {
        return teardown();
    });

    after(function() {
        closeServer();
    });

    describe('GET endpoint', function() {
    // strategry
    // get all blog posts returned by GET request to `/posts`

        it('should return all existing blogposts', function() {
            let res;
            return chai.request(app)
                .get('/posts')
                .then(function(_res) {
                    res = _res;
                    expect(res).to.have.status(200);
                    expect(res).to.have.lengthOf.at.least(1);
                    return BlogPost.count();
                })
                .then(function(count) {
                    expect(res.body.posts).to.have.lengthOf(count);
                });
        });

        it('should return posts with the right fields', function() {
            let resPost;
            return chai.request(app)
                .get('/posts')
                .then(function(res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body.posts).to.be.a('array');
                    expect(res.body.posts).to.have.lengthOf.at.least(1);

                    res.body.posts.forEach(function(post) {
                        expect(post).to.be.a('object');
                        expect(post).to.include.keys('id', 'title', 'content', 'author', 'created');
                    });
                    resPost = res.body.posts[0];
                    return BlogPost.findById(resPost.id);
                })
                .then(function(post) {
                    expect(resPost.id).to.equal(post.id);
                    expect(resPost.title).to.equal(post.title);
                    expect(resPost.author.firstName).to.equal(post.author.firstName);
                    expect(resPost.author.lastName).to.equal(post.author.lastName)
                    expect(resPost.content).to.equal(post.content);
                    expect(resPost.created).to.equal(post.created);
                });
        });
    });

    describe('POST endpoint', function() {
        it('should add a new post', function() {
            const newPost = generateBlogPostData();

            return chai.request(app)
                .post('/posts')
                .send(newPost)
                .then(function(res) {
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res).to.be.a('object');
                    expect(res).to.include.keys('id', 'title', 'content', 'author', 'created');
                    expect(res.body.title).to.equal(newPost.title);
                    expect(res.body.id).to.not.be.null;
                    expect(res.author.firstName).to.equal(newPost.author.firstName);
                    expect(res.author.lastName).to.equal(newPost.author.lastName);
                    expect(res.body.content).to.equal(newPost.content);
                    expect(res.body.created).to.equal(newPost.created);
                    return BlogPost.findById(res.body.id);
                })
                .then(function(post) {
                    expect(post.title).to.equal(newPost.title);
                    expect(post.content).to.equal(newPost.content);
                    expect(post.created).to.equal(newPost.created);
                    expect(post.author.firstName).to.equal(newPost.author.firstName);
                    expect(post.author.lastName).to.equal(newPost.author.lastName);
                });
        });
    });
    describe('PUT endpoint', function() {
        it('should update fields you send over', function() {
            const updateData = {
                title: 'fofofofofofof',
                content: 'bar bar bar bar bar bar bar bar bar bar bar bar bar bar'
            };

            return BlogPost
                .findOne()
                .then(function(post) {
                    updateData.id = post.id;

                    return chai.request(app)
                        .put(`/posts/${restaurant.id}`)
                        .send(updateData);
                })
                .then(function(res) {
                    expect(res).to.have.status(204);

                    return BlogPost.findById(updateData.id);
                })
                .then(function(post) {
                    expect(post.title).to.equal(updateData.title);
                    expect(post.content).to.equal(updateData.content);
                });
        });
    });

    describe('DELETE endpoint', function() {
        it('delete a restaurant by id', function() {

            let post;

            return BlogPost
                .findOne()
                .then(function(_post) {
                    post = _post;
                    return chai.request(app).delete(`/posts/${post.id}`);
                })
                .then(function(res) {
                    expect(res).to.have.status(204);
                    return BlogPost.findById(post.id);
                })
                .then(function(_post) {
                    expect(_post).to.be.null;
                });;
        });
    });
});