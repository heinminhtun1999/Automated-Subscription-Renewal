module.exports = {
    apps: [
        {
            name: 'Automated Subscription Renewal',
            script: 'src/index.js',
            env: {
                NODE_ENV: 'development',
                PORT: 4000,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 4000,
            }
        }
    ]
}