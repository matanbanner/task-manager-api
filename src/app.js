const express = require('express')
require('./db/monsooge')

const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const User = require('../src/models/user')
const Task = require('../src/models/task')

const app = express()
const port = process.env.PORT

// app.use((req, res, next) => {
//     res.status(503).send('The site under maintenance!')
// })

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

module.exports = app