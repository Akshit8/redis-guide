const express = require('express')
const redis = require('redis')
const fetch = require('node-fetch')

const redis_port = process.env.REDIS_PORT
const port = process.env.PORT

const app = new express()
const client = redis.createClient(redis_port)

const setResponse = (username, repos)=>{
    return `<h2>${username} has ${repos} github repos</h2>`
}

// make a request to github api
const getRepos = async(req, res, next)=>{
    console.log('fetching data...')
    try{
        const {username} = req.params
        const response = await fetch(`https://api.github.com/users/${username}`)
        const data = await response.json()

        const repos = data.public_repos
        //set to redis
        client.setex(username, 3600, repos)         //time here determines for how time the cache is active!
        
        res.send(setResponse(username, repos))
    }catch(e){
        res.status(500).send(e)
    }
}

//cache middleware
const cache = (req, res, next)=>{
    console.log('cache middleware')
    const {username} = req.params

    client.get(username, (err, data)=>{
        if(err) throw err

        if(data){
            res.send(setResponse(username, data))
        }else{
            next()
        }
    })
}

app.get('/repos/:username',cache, getRepos)

app.listen(port,()=>console.log(`server is fired up at port ${port}`))