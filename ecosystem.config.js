const isProduction = process.env.NODE_ENV === 'production';
const path = require('path');

module.exports = {
    apps: [
        {
            // PM2 process definition for the web app.
            name: isProduction ? 'asr' : 'asrd',
            cwd: __dirname,
            script: path.join(__dirname, 'src/index.js'),
            env: {
                TZ: 'ASIA/Kuala_Lumpur'
            }
        },
        {
            // PM2 process definition for the cron worker.
            name: isProduction ? 'asrc' : 'asrdc',
            cwd: __dirname,
            script: path.join(__dirname, 'src/jobs/worker.js'),
            env: {
                TZ: 'ASIA/Kuala_Lumpur'
            }
        }
    ]
};