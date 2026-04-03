module.exports = {
    apps: [
        {
            // PM2 process definition for the app.
            name: 'Automated Subscription Renewal',
            script: 'src/index.js',
            env: {
                // Default development environment variables.
                NODE_ENV: 'development',
                PORT: 4000,
            },
            env_production: {
                // Production overrides.
                NODE_ENV: 'production',
                PORT: 4000,
            }
        }
    ]
}