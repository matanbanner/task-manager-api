const express = require('express')
const auth = require('../../src/middleware/auth')
const Task = require('../models/task')
const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    
    try {
        await task.save()
        res.status(201).send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=CreatedAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    if (req.query.completed) {
        match.completed = req.query.completed
    }
    
    try {
        // const tasks = await Task.find({owner: req.user._id})
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch(e) {
        res.status(500).send()
    }
})

// we keep this one with promoise chaning style to as a reminder

router.get('/tasks/:id', auth, (req, res) => {
    const _id = req.params.id

    Task.findOne({ _id, owner: req.user._id }).then((task) => {
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    }).catch((e) => {
        res.status(500).send(e)
    })
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidation = updates.every(update => allowedUpdates.includes(update))

    if (!isValidation) {
        return res.status(400).send({error: 'Invalid updates were requested!'})
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
        
        if (!task) {
            return res.status(404).send()
        }

        updates.forEach(update => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch(e) {
        res.status(500).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch(e) {
        res.status(500).send(e)
    }
})


module.exports = router