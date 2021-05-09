const jwt = require('jsonwebtoken')
const redis = require('redis')

//setup Redis:
const redisClient = redis.createClient({host: process.env.REDIS_HOST})

const handleSignin = (db, bcrypt, req, res) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return Promise.reject('incorrect form submission');
    }

    return db.select('email', 'hash').from('login')
        .where('email', '=', email)
        .then(data => {
            const isValid = bcrypt.compareSync(password, data[0].hash);
            if (isValid) {
                return db.select('*').from('users')
                    .where('email', '=', email)
                    .then(user => user[0])
                    .catch(err => Promise.reject('unable to get user'))
            } else {
                Promise.reject('wrong credentials')
            }
        })
        .catch(err => Promise.reject('wrong credentials'))
}

const signinAuthentication = (db, bcrypt) => (req, res) => {
    const {authorization} = req.headers;

    return authorization ?
        getAuthTokenId(req, res) :
        handleSignin(db, bcrypt, req, res)
            .then(data => {
                return data.id && data.email ?
                    createSession(data) :
                    Promise.reject(data)
            })
            .then(session => res.json(session))
            .catch(err => res.status(400).json(err))
}

function createSession(user) {
    const {email, id} = user
    const token = signToken(email)
    return setToken(token, id)
        .then(() => ({success: 'true', id, token}))
        .catch(console.log);

}

function setToken(token, id) {
    return Promise.resolve(redisClient.set(token, id))
}

function signToken(email) {
    return jwt.sign({email}, process.env.JWTSECRET, {expiresIn: '2 days'});
}

const getAuthTokenId = (req, res) => {

    const {authorization} = req.headers;
    redisClient.get(authorization, (err, reply) => {
        if (err || !reply) {
            return res.status(400).json('Unauthorized')
        }

        return res.json({id: reply})
    })

    console.log('auth ok')
}

module.exports = {
    signinAuthentication: signinAuthentication
}