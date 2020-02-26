const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userOne, userOneId, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase)

test('Should signup a new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'Matan',
        email: 'matan.bssdansssner@gmail.com',
        password: 'mypass!!!!'
    }).expect(201)

    // Assert that the user was added to database
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    // Validate resoponse
    expect(response.body).toMatchObject({
        user: {
            name: 'Matan',
            email: 'matan.bssdansssner@gmail.com',
        },
        token: user.tokens[0].token
    })
})

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    // Assert response token equal user's token in database
    const user = await User.findById(userOneId)
    expect(response.body.token).toBe(user.tokens[1].token)

    
})

test('Should not login nonexistent user', async () => {
    await request(app).post('/users/login').send({
        email: 'nonexistent@mail.com',
        password: 'mypass!!!!'
    }).expect(400)
})

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update valid user field', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'new name'
        })
        .expect(200)
    const user = await User.findById(userOneId)
    expect(user.name).toBe('new name')
})

test('Should not update unvalid user field', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'Hadera'
        })
        .expect(400)
})



