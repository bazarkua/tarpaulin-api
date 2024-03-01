const { token } = require('morgan')
const redis = require('redis')

const redisHost = process.env.REDIS_HOST || 'localhost'
const redisPort = process.env.REDIS_PORT || 6379
const redisClient = redis.createClient({
  url: `redis://${redisHost}:${redisPort}`
})

const rateLimitWindowMillis = 60000 // 1 minute
const rateLimitMaxRequests = 10
const rateLimitRefreshRate = rateLimitMaxRequests / rateLimitWindowMillis

// Throws an error when redis connection fails
exports.connectToRedis = (callback) => redisClient.connect().then(callback)

async function updateTokenBucket(ip, tokens, last) {
    await redisClient.hSet(ip, [
        ['tokens', tokens],
        ['last', last]
    ])
}

exports.rateLimit = async (req, res, next) => {          
    let tokenBucket
    try {
        // Gets stucks waiting on promise when client is down :/
        tokenBucket = await redisClient.hGetAll(req.ip)
    } catch(e) {
        next()
        return
    }

    tokenBucket = {
        tokens: parseFloat(tokenBucket.tokens) || rateLimitMaxRequests,
        last: parseInt(tokenBucket.last) || Date.now()
    }

    const timestamp = Date.now()
    const ellapsedMillis = timestamp - tokenBucket.last
    tokenBucket.tokens += ellapsedMillis * rateLimitRefreshRate
    tokenBucket.tokens = Math.min(tokenBucket.tokens, rateLimitMaxRequests)
    tokenBucket.last = timestamp

    if (tokenBucket.tokens >= 1) {
        tokenBucket.tokens--
        await updateTokenBucket(req.ip, tokenBucket.tokens, tokenBucket.last)
        next()
    } else {
        await updateTokenBucket(req.ip, tokenBucket.tokens, tokenBucket.last)
        res.status(429).send({
            error: 'Too many requests per minute'
        })
    }
}
