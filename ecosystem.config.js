const isProduction = process.env.NODE_ENV === 'production';
const path = require('path');

module.exports = {
    apps: [
        {
            // PM2 process definition for the web app.
            name: isProduction ? 'asr' : 'asr-dev',
            cwd: __dirname,
            script: path.join(__dirname, 'src/index.js')
        },
        {
            // PM2 process definition for the cron worker.
            name: isProduction ? 'asr-crons' : 'asr-dev-crons',
            cwd: __dirname,
            script: path.join(__dirname, 'src/jobs/worker.js')
        }
    ]
}