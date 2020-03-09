const express = require('express')
const User = require('../models/user')
const { auth, adminAuth} = require('../middleware/auth')
const { sendWelcomeEmail, sendGoodByeEmail } = require('../emails/account')
const multer = require('multer')
const sharp = require('sharp')
const router = new express.Router()



router.post('/users', async (req, res) => {
    const attributes = Object.keys(req.body)
    
    if (!validateAttributes(attributes)) {
        return res.status(400).send({error: 'Invalid attributes!'})
    }
    const user = new User(req.body)
    
    try {
        await user.save()
        
        // sending welcome email (await should not be used here)
        sendWelcomeEmail(user.email, user.name)
        
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch(e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch(e) {
        res.status(400).send(e)
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token )
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send(e)
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    
    if (!validateAttributes(updates)) {
        return res.status(400).send({error: 'Invalid updates!'})
    }
    
    try {
        updates.forEach((update => req.user[update] = req.body[update]))
        await req.user.save()
        res.send(req.user)
    } catch(e) {
        res.status(500).send(e)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        sendGoodByeEmail(req.user.email, req.user.name)
        await req.user.remove()
        res.send(req.user)
    } catch(e) {
        res.status(500).send(e)
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('File type can only be "jpg", "jpeg" and "png"'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/me/avatar', auth, async (req, res) => {
    if (!req.user.avatar) {
        return res.status(404).send()
    }
    res.set('Content-Type', 'image/png')
    res.send(req.user.avatar)
})




// The following endpoints require admin permission



// GET /users?admin=true
// GET /users?limit=10&skip=20
// GET /users?sortBy=CreatedAt:desc
router.get('/users', auth, adminAuth, async (req, res) => {
    
    const limit = parseInt(req.query.limit)
    const skip = parseInt(req.query.skip)
    const admin = req.query.admin
    const sortArgs = {}
    
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sortArgs[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        const users = await User.find({admin}, null, {skip, limit}).sort(sortArgs)
        res.send(users)
    } catch(e) {        
        res.status(500).send()
    }
})

router.delete('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).send()
        }
        sendGoodByeEmail(user.email, user.name)
        await user.remove()
        res.send(user)
    } catch(e) {
        res.status(500).send()
    }
})


router.get('/users/:id/avatar', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) {
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
     
})



const validateAttributes = (attributes) => {
    const allowedAttributes = ['name', 'email', 'password', 'age']
    return attributes.every(attr => allowedAttributes.includes(attr))
}


module.exports = router