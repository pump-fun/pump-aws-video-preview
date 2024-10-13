const { S3 } = require('aws-sdk');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const s3 = new S3();
const ffmpegPath = process.env.FFMPEG_PATH || '/opt/bin/ffmpeg';
const ffprobePath = process.env.FFPROBE_PATH || '/opt/bin/ffprobe';

export const handler = async (event: any) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const tmpFilePath = `/tmp/${path.basename(key)}`;

    try {
      // Download the video file
      await downloadFromS3(bucket, key, tmpFilePath);

      // Get video duration
      const duration = await getVideoDuration(tmpFilePath);

      // Generate thumbnails
      const thumbnails = await generateThumbnails(tmpFilePath, duration);

      // Upload thumbnails to S3
      const filename = path.parse(key).name;
      const percentages = [0, 50, 100];
      for (let i = 0; i < thumbnails.length; i++) {
        const thumbnailKey = `${process.env.THUMBNAIL_FOLDER}${filename}_${percentages[i]}.jpg`;
        await uploadToS3(bucket, thumbnailKey, thumbnails[i]);
      }


      console.log(`Successfully processed video: ${key}`);
    } catch (error) {
      console.error(`Error processing video ${key}:`, error);
    } finally {
      // Clean up temporary files
      if (fs.existsSync(tmpFilePath)) fs.unlinkSync(tmpFilePath);
      for (const thumbnail of await fs.promises.readdir('/tmp')) {
        if (thumbnail.startsWith('thumbnail_')) {
          fs.unlinkSync(`/tmp/${thumbnail}`);
        }
      }
    }
  }
};

async function downloadFromS3(bucket: string, key: string, filePath: string): Promise<void> {
  const params = { Bucket: bucket, Key: key };
  const { Body } = await s3.getObject(params).promise();
  fs.writeFileSync(filePath, Body as Buffer);
}

async function uploadToS3(bucket: string, key: string, filePath: string): Promise<void> {
  const fileContent = fs.readFileSync(filePath);
  const params = { Bucket: bucket, Key: key, Body: fileContent };
  await s3.putObject(params).promise();
}

async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const process = spawn(ffprobePath, [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      videoPath
    ]);

    let output = '';
    process.stdout.on('data', (data: any) => {
      output += data.toString();
    });

    process.on('close', (code: any) => {
      if (code !== 0) {
        reject(new Error(`ffprobe process exited with code ${code}`));
      } else {
        resolve(parseFloat(output.trim()));
      }
    });
  });
}

async function generateThumbnails(videoPath: string, duration: number): Promise<string[]> {
  const thumbnailTimes = [0, duration / 2, Math.max(0, duration - 0.1) ];
  const thumbnailPromises = thumbnailTimes.map((time, index) => 
    generateThumbnail(videoPath, time, index)
  );
  return Promise.all(thumbnailPromises);
}

async function generateThumbnail(videoPath: string, time: number, index: number): Promise<string> {
  const outputPath = `/tmp/thumbnail_${index}.jpg`;
  return new Promise((resolve, reject) => {
    const process = spawn(ffmpegPath, [
      '-i', videoPath,
      '-ss', time.toString(),
      '-vframes', '1',
      outputPath
    ]);

    process.on('close', (code: any) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg process exited with code ${code}`));
      } else {
        resolve(outputPath);
      }
    });
  });
}