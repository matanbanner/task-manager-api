const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token})

        if(!user) {
            throw new Error()
        }

        req.token = token
        req.user = user
        next()
    } catch (e) {
        res.status(401).send('Please authenticate.')
    }
}

const adminAuth = async (req, res, next) => {
    if (!req.user.admin) {
        return res.status(401).send('Missing permission')
    }
    next()
}

module.exports = {
    auth,
    adminAuth
}