module.exports = {
    apps: [
        {
            name: 'asr-dev',
            script: 'src/index.js',
            env: {
                NODE_ENV: 'development',
                PORT: 4000,
            }
        },
        {
            name: 'asr',
            script: 'src/index.js',
            env: {
                NODE_ENV: 'production',
                PORT: 4000,
            }
        }
    ]
}