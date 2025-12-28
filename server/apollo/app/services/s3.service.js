/**************** ************
 Pagename : s3 service
 Author :
 CreatedDate : 20.11.2021

 Purpose : S3 specific service
 *****************************/
const aws = require('aws-sdk');
const crypto = require('crypto');
const CONFIG = require('../config/');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// aws.config = new aws.Config({
//     region: process.env.S3_REGION,
//     accessKeyId: process.env.S3_ACCESS_KEY,
//     secretAccessKey: process.env.S3_SECRET_KEY,
//     signatureVersion: 'v4',
//     awsPath: process.env.AWS_PATH,
// });

// Configure AWS SDK
aws.config.update({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    region: process.env.S3_REGION,
});

const s3 = new aws.S3();
const BUCKET_NAME = process.env.BUCKET_NAME;

let InjectServices = {};

module.exports = {

    uploadFileToS3: async (fileBuffer, fileName, mimeType, folder = '') => {
        const extension = path.extname(fileName).toLowerCase();
        const s3Key = `${folder}/${uuidv4()}${extension}`

        const params = {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileBuffer,
            ContentType: mimeType,
            ACL: 'public-read',
        };

        await s3.upload(params).promise();

        return `https://${BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${s3Key}`;
    }
    /**
     *
     * @param Services
     */
    // inject: (Services) => {
    //     InjectServices = Services;
    // },

    // getAmazonS3Creds: () => {
    //     return {
    //         region: Lib.ENV('S3_REGION'),
    //         accessKeyId: Lib.ENV('S3_ACCESS_KEY'),
    //         secretAccessKey: Lib.ENV('S3_SECRET_KEY'),
    //         signatureVersion: 'v4',
    //         bucket: Lib.ENV('BUCKET_NAME'),
    //         awsPath: Lib.ENV('AWS_PATH'),
    //         poolId: "",
    //     };
    // },

    // generateS3UploadURL: async (params) => {
    //     try {
    //         let Bucket = params.data.bucket ? params.data.bucket : Lib.ENV('BUCKET_NAME');
    //         let FolderList = params.data.folderList ? params.data.folderList : [];
    //         let type = params.data.type ? params.data.type : '';
    //         let extension = "";
    //         if (type && type !== "") {
    //             extension = type;
    //             // extension = type.split("/")[1];
    //             if (extension === "svg+xml") extension = "svg";
    //             extension = "." + extension;
    //         }
    //         const rawBytes = crypto.randomBytes(8);
    //         const objectname = rawBytes.toString('hex') + extension;
    //         if (!Bucket || Bucket.length === 0) {
    //             Bucket = process.env.BUCKET_NAME;
    //         }

    //         // Adding folder to Bucket
    //         if (FolderList && Array.isArray(FolderList) && FolderList.length > 0) {
    //             FolderList = FolderList.join("/");
    //             FolderList += "/" + objectname;
    //         } else {
    //             FolderList = objectname;
    //         }
    //         const S3params = ({
    //             Bucket: Bucket,
    //             Key: FolderList,
    //             Key: objectname,
    //             // Expires: (CONFIG.S3_EXPIRES.DIRECT_UPLOAD_LIMIT * 60), // Accepts as Seconds
    //             Expires: (10 * 60), // Accepts as Seconds
    //             // ContentType: type
    //         });
    //         const uploadurl = await s3.getSignedUrlPromise('putObject', S3params);
    //         return ({ error: false, message: "generalSuccess", data: { url: uploadurl, Key: FolderList } });
    //     } catch (err) {
    //         console.log(err);
    //         throw err;
    //     }
    // },

}