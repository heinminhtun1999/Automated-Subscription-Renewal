const { S3Client, ListObjectsV2Command, DeleteObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { sendEmail } = require("../utils/services/nodemailer");
const logger = require("../utils/services/winston");
const fs = require("fs");
const path = require("path");
const dotenv = require('dotenv');
const { execSync } = require("child_process");

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const BACKUP_DIR = path.join(__dirname, '..', '..', '..', 'backups');
const DB_PATH = path.join(__dirname, '..', 'db', 'database.db');
const RETENTION_DAYS = 30;
const BACKUP_BUCKET_NAME = process.env.B2_BUCKET_NAME || process.env.B2_BACKUP_NAME;

const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_SECRET_ACCESS_KEY
    },
    endpoint: process.env.B2_END_POINT,
    region: process.env.B2_REGION
});

async function backupDatabase() {
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `database-${timestamp}.db`;
    const localPath = path.join(BACKUP_DIR, filename);

    try {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });

        if (!BACKUP_BUCKET_NAME) {
            throw new Error('Missing Backblaze bucket name. Set B2_BUCKET_NAME or B2_BACKUP_NAME in .env.');
        }

        // Dump DB safely to local backup dir
        execSync(`sqlite3 "${DB_PATH}" ".backup '${localPath}'"`);
        logger.info(`Database backed up locally: ${localPath}`);

        // Upload to Backblaze
        const fileBuffer = fs.readFileSync(localPath);
        await s3.send(new PutObjectCommand({
            Bucket: BACKUP_BUCKET_NAME,
            Key: filename,
            Body: fileBuffer,
            ContentType: "application/octet-stream",
        }));
        logger.info(`Database backup uploaded to Backblaze: ${filename}`);

        // Enforce retention — delete backups older than 30 days
        await enforceRetention();

        // Clean up local file after successful upload
        // fs.unlinkSync(localPath);

    } catch (error) {
        logger.error("Database backup failed:", error);
        await sendEmail(
            process.env.DEV_EMAIL,
            "|ASR| Critical: Database Backup Failed",
            `<p>Database backup failed at ${new Date().toLocaleString()}.</p><p>${error.message}</p>`
        );
    }
}

async function enforceRetention() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    if (!BACKUP_BUCKET_NAME) {
        throw new Error('Missing Backblaze bucket name. Set B2_BUCKET_NAME or B2_BACKUP_NAME in .env.');
    }

    const listed = await s3.send(new ListObjectsV2Command({
        Bucket: BACKUP_BUCKET_NAME,
    }));

    if (!listed.Contents) return;
    for (const obj of listed.Contents) {
        if (obj.LastModified < cutoff) {
            const localPath = path.join(BACKUP_DIR, obj.Key);
            fs.unlinkSync(localPath);
            await s3.send(new DeleteObjectCommand({
                Bucket: BACKUP_BUCKET_NAME,
                Key: obj.Key,
            }));
            logger.info(`Deleted old backup: ${obj.Key}`);
        }
    }
}

module.exports = backupDatabase;