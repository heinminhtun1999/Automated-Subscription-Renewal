const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
    apps: [
        {
            // PM2 process definition for the web app.
            name: isProduction ? 'asr' : 'asr-dev',
            cwd: __dirname,
            script: 'src/index.js',
            env_file: '.env',
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
        },
        {
            // PM2 process definition for the cron worker.
            name: isProduction ? 'asr-crons' : 'asr-dev-crons',
            cwd: __dirname,
            script: 'src/jobs/worker.js',
            env_file: '.env',
            env: {
                NODE_ENV: 'development'
            },
            env_production: {
                NODE_ENV: 'production'
            }
        }
    ]
}