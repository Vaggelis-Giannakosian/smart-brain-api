const redis = require('redis')

//setup Redis:
const redisClient = redis.createClient({host: process.env.REDIS_HOST})


const requireAuth = (req, res, next) => {

    const {authorization} = req.headers

    if (!authorization) {
        return res.status(401).json('Unauthorized')
    }

    return redisClient.get(authorization, (err, reply) => {
        if(err || !reply){
            return res.status(401).json('Unauthorized')
        }

        return next();
    })
}

module.exports = {
    requireAuth
}