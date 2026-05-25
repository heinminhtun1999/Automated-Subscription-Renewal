const { S3Client, ListBucketsCommand, CreateBucketCommand, PutObjectCommand, Bucket$ } = require("@aws-sdk/client-s3");
const { loadSharedConfigFiles } = require("@aws-sdk/shared-ini-file-loader");
const fs = require("fs");
const path = require("path");
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const b2 = new S3Client({
    credentials: {
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_SECRET_ACCESS_KEY
    },
    endpoint: process.env.B2_END_POINT,
    region: process.env.B2_REGION
});


// const listBuckets = async () => {

// }

(async () => {
    try {
        console.log(process.env.B2_END_POINT)
        const response = await b2.send(new ListBucketsCommand({}));
        response.Buckets.forEach(bucket => {
            console.log(bucket)
        });
    } catch (e) {
        console.error("Error listing buckets: ", e);
        throw e;
    }
})()



// async function backupDatabase() {
//     const timestamp = new Date().toISOString().split("T")[0];
//     const filename = `database-${timestamp}.db`;
//     const localPath = path.join(BACKUP_DIR, filename);

//     try {
//         // 1. Dump DB safely to local backup dir
//         execSync(`sqlite3 "${DB_PATH}" ".backup '${localPath}'"`);
//         logger.info(`Database backed up locally: ${localPath}`);

//         // 2. Upload to Backblaze
//         const fileBuffer = fs.readFileSync(localPath);
//         await s3.send(new PutObjectCommand({
//             Bucket: process.env.B2_BUCKET_NAME,
//             Key: filename,
//             Body: fileBuffer,
//             ContentType: "application/octet-stream",
//         }));
//         logger.info(`Database backup uploaded to Backblaze: ${filename}`);

//         // 3. Enforce retention — delete backups older than 30 days
//         await enforceRetention();

//         // 4. Clean up local file after successful upload
//         fs.unlinkSync(localPath);

//     } catch (error) {
//         logger.error("Database backup failed:", error);
//         await sendEmail(
//             process.env.DEV_EMAIL,
//             "|ASR| Critical: Database Backup Failed",
//             `<p>Database backup failed at ${new Date().toLocaleString()}.</p><p>${error.message}</p>`
//         );
//     }
// }

// async function enforceRetention() {
//     const cutoff = new Date();
//     cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

//     const listed = await s3.send(new ListObjectsV2Command({
//         Bucket: process.env.B2_BUCKET_NAME,
//     }));

//     if (!listed.Contents) return;

//     for (const obj of listed.Contents) {
//         if (obj.LastModified < cutoff) {
//             await s3.send(new DeleteObjectCommand({
//                 Bucket: process.env.B2_BUCKET_NAME,
//                 Key: obj.Key,
//             }));
//             logger.info(`Deleted old backup: ${obj.Key}`);
//         }
//     }
// }

// module.exports = backupDatabase;