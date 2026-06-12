import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";

/**
 * S3-compatible object storage for private files (resumes, JDs, result sheets).
 * Files are never proxied through the API — clients upload/download directly via
 * short-lived presigned URLs.
 */
const s3 = new S3Client({
  region: env.s3.region,
  endpoint: env.s3.endpoint,
  forcePathStyle: Boolean(env.s3.endpoint), // MinIO / R2 style
  credentials:
    env.s3.accessKeyId && env.s3.secretAccessKey
      ? { accessKeyId: env.s3.accessKeyId, secretAccessKey: env.s3.secretAccessKey }
      : undefined,
});

/** Presigned URL the client uses to PUT a file straight to storage. */
export function presignUpload(key: string, contentType: string, expiresIn = 300) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: env.s3.bucket, Key: key, ContentType: contentType }),
    { expiresIn }
  );
}

/** Presigned URL to GET (view/download) a private file. */
export function presignDownload(key: string, expiresIn = 300) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: env.s3.bucket, Key: key }), {
    expiresIn,
  });
}
