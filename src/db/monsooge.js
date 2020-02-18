const mongoose = require('mongoose')

mongoose.connect(`${process.env.MONGODB_USL}/task-manager-api`, {
    useNewUrlParser: true,
    useCreateIndex: true
})
