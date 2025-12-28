/**************** ************
 Pagename : s3 service
 Author :
 CreatedDate : 20.11.2021

 Purpose : S3 specific service
 *****************************/
const aws = require('aws-sdk');
const crypto = require('crypto');
const CONFIG = require('../../../config/config');
const Constants = require('../../../constant');
const library = require('../../../library/library');

aws.config = new aws.Config({
    region: process.env.S3_REGION,
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    signatureVersion: 'v4'
});
const s3 = new aws.S3();
let InjectServices = {};
module.exports = {
    /**
     *
     * @param Services
     */
    inject: (Services) => {
        InjectServices = Services;
    },

    /**************** ************
     Function name :  getAmazonCreds
     Author :
     CreatedDate : 15.11.2021

     Purpose : Get Amazon Creds
     Params:
     *****************************/
    getAmazonCreds: () => {
        return {
            region: process.env.S3_REGION,
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY,
            signatureVersion: 'v4',
            bucket: process.env.BUCKET_NAME,
            awsACL: process.env.AWS_ACL,
            awsPath: process.env.AWS_PATH,
            poolId: "",
            sampleVideoPath: process.env.SampleVideoPath,
            maestroIntroductionPath: process.env.MaestroIntroductionPath,
            maestroEducationCertificate: process.env.MaestroEducationCertificate,
            maestroCategoryCertificate: process.env.MaestroCategoryCertificate,
            userProfilePic: process.env.UserProfilePic
        };
    },

    /**************** ************
     Function name :  generateS3UploadURL
     Author :
     CreatedDate : 15.11.2021

     Purpose : Generate S3 Upload URL
     Params: Bucket, FolderList, type
     *****************************/
    generateS3UploadURL: async (Bucket = "", FolderList = [], type = "") => {
        /**
         * For only one time upload of one object
         * @returns Returns the signed URL.
         */
        let extension = "";
        if (type && type !== "") {
            extension = type.split("/")[1];
            if (extension === "svg+xml") extension = "svg";
            extension = "." + extension;
        }
        const rawBytes = crypto.randomBytes(16);
        const objectname = rawBytes.toString('hex') + extension;
        if (!Bucket || Bucket.length === 0) {
            Bucket = process.env.BUCKET_NAME;
        }
        // Adding folder to Bucket
        if (FolderList && Array.isArray(FolderList) && FolderList.length > 0) {
            FolderList = FolderList.join("/");
            FolderList += "/" + objectname;
        } else {
            FolderList = objectname;
        }
        const params = ({
            Bucket: Bucket,
            Key: FolderList,
            Expires: (CONFIG.S3_EXPIRES.DIRECT_UPLOAD_LIMIT * 60), // Accepts as Seconds
            ContentType: type
        });
        const uploadurl = await s3.getSignedUrlPromise('putObject', params);
        return {url: uploadurl, Key: objectname};

    },

    /**************** ************
     Function name : initCreateMultiPartUpload
     Author :
     CreatedDate : 15.11.2021

     Purpose : Create MultiPart Upload
     Params: Bucket, FolderList, type
     *****************************/
    initCreateMultiPartUpload: async (Bucket = '', folders = [], type = '') => {
        /**
         *
         * @param {string} Bucket
         * @param {string|Array<string>} folders
         * @param {string} type
         * @returns {Promise<{error_code: string, error: boolean, message: string}|{data: {uploadedId: S3.MultipartUploadId, Key: string}, error: boolean, message: string}>}
         */
        try {
            const rawBytes = crypto.randomBytes(16);
            const objectname = rawBytes.toString('hex');
            const expires = new Date()() + (CONFIG.S3_EXPIRES.MULTIPART_UPLOAD_LIMIT * 60 * 1000); // 20 min
            Bucket = Bucket ? Bucket : process.env.BUCKET_NAME;
            let Key = folders;
            if (Array.isArray(folders)) {
                // Generate the key
                Key = folders.filter(Boolean).join("/") + "/" + objectname + (type ? ("." + type) : "");
            } else if (typeof folders === 'string') {
                Key += "/" + objectname + (type ? ("." + type) : "");
            }
            let ContentType = library.extractContentType(type);

            const params = ({
                Bucket: Bucket,
                Key: Key,
                Expires: expires
            });
            if (ContentType) params.ContentType = ContentType;
            const multiPartRes = await s3.createMultipartUpload(params).promise();
            let uploadedId = multiPartRes.UploadId;
            return {error: false, message: "s3CreateMultipartUploadIDSuccess", data: {uploadedId, Key: Key}};
        } catch (e) {
            if (CONFIG.IS_LOCAL) console.log("S3 Multipart upload error: ", e);
            if (!CONFIG.IS_LOCAL) library.log(e.stack, "CREATEMULTIPARTUPLOADSRCV001");
            return {
                error: true,
                message: "s3CreateMultipartUploadIDFailed",
                error_code: "CREATEMULTIPARTUPLOADSRCV001"
            };
        }
    },

    /**************** ************
     Function name : getSignedUrlForPart
     Author :
     CreatedDate : 15.11.2021

     Purpose : Get Signed Url For Part
     Params: data
     *****************************/
    getSignedUrlForPart: async (data) => {
        try {
            const {Bucket, Key, PartNumber, UploadId, ContentType} = data;

            const param = ({
                Bucket: Bucket ? Bucket : process.env.BUCKET_NAME,
                Key: Key,
                PartNumber: PartNumber,
                UploadId: UploadId
            });
            if (ContentType) param.ContentType = ContentType;
            const preSignedUrl = await s3.getSignedUrlPromise('uploadPart', param);
            return {error: false, message: "s3getSignedUrlForPartSuccess", url: preSignedUrl};
        } catch (e) {
            if (CONFIG.IS_LOCAL) console.log("S3 Multipart upload presigned url creation error: ", e);
            if (!CONFIG.IS_LOCAL) library.log(e.stack, "GETSIGNEDURLSRCV001");
            return {error: true, message: "s3getSignedUrlForPartFailed", error_code: "GETSIGNEDURLSRCV001"};
        }
    },

    /**************** ************
     Function name : completeMultipartUpload
     Author :
     CreatedDate : 15.11.2021

     Purpose : Complete Multipart Upload
     Params: data
     *****************************/
    completeMultipartUpload: async (data) => {
        try {
            const {Key, Parts, UploadId} = data;
            const param = ({
                Bucket: process.env.BUCKET_NAME,
                Key: Key,
                MultipartUpload: {
                    Parts: Parts
                },
                UploadId: UploadId
            });
            const completeUploadRes = await s3.completeMultipartUpload(param).promise();
            return {error: false, message: "s3CompleteMultiPartUploadSuccess", completeUploadRes: completeUploadRes};
        } catch (e) {
            if (CONFIG.IS_LOCAL) console.log("S3 Multipart upload presigned url creation error: ", e);
            if (!CONFIG.IS_LOCAL) library.log(e.stack, "GETSIGNEDURLSRCV001");
            return {error: true, message: "s3CompleteMultiPartUploadFaield", error_code: "GETSIGNEDURLSRCV001"};
        }
    },

    /**************** ************
     Function name : createGetMultiPlartUploadService
     Author :
     CreatedDate : 15.11.2021

     Purpose : Create Get MultiPlart Upload Service
     Params: data
     *****************************/
    createGetMultiPlartUploadService: async function (data) {
        try {
            const {Bucket, partscount, folders, type} = data;
            let extension = library.extractExtension(type);
            // Create the upload id with object name
            const uploadRes = await this.initCreateMultiPartUpload(Bucket, folders, extension);
            if (uploadRes.error) {
                return {error: true, message: uploadRes.message, error_code: uploadRes.error_code};
            }
            let ContentType = library.extractContentType(extension);
            const UploadId = uploadRes.data.uploadedId;
            const Key = uploadRes.data.Key;
            let MultiPartPresignedURLS = [];
            const paramPart = {
                Bucket: Bucket,
                Key: Key,
                // PartNumber: (i + 1),
                UploadId: UploadId
            };
            if (ContentType) paramPart.ContentType = ContentType;
            for (let i = 0; i < partscount; i++) {
                paramPart.PartNumber = (i + 1);
                const presignedUrlRes = await this.getSignedUrlForPart(paramPart);
                if (presignedUrlRes.error) {
                    return {
                        error: true,
                        message: presignedUrlRes.message,
                        error_code: presignedUrlRes.error_code,
                        part: (i + 1)
                    };
                }
                MultiPartPresignedURLS.push({url: presignedUrlRes.url, part: (i + 1)});
            }
            return {
                error: false,
                message: "s3CreateGetMultipartUploadServiceSuccess",
                presignedUrls: MultiPartPresignedURLS,
                UploadId,
                Key
            };
        } catch (e) {
            if (CONFIG.IS_LOCAL) console.log("Error when generating presigned url: ", e);
            if (!CONFIG.IS_LOCAL) library.log(e.stack, "CREATEGETMULTIPARTUPLOADSECV001");
            return {
                error: true,
                message: "s3CreateGetMultipartUploadServiceFailed",
                error_code: "CREATEGETMULTIPARTUPLOADSECV001"
            };
        }
    },

    /**************** ************
     Function name : deleteFromS3
     Author :
     CreatedDate : 15.11.2021

     Purpose : Delete From S3
     Params: bucket, key
     *****************************/
    deleteFromS3: async (bucket, key) => {
        /**
         * Delete single object
         * @param {string} bucket is the bucket from whick the object needs to be deleted
         * @param {object} key key is the object key to be deleted
         * @returns object of info weather the object has been deleted successfully or not
         */
        try {
            if (!bucket || bucket === "") {
                bucket = process.env.BUCKET_NAME;
            }
            if (Array.isArray(key) && key.length > 0) {
                key = key.join('/');
            }
            const param = {
                Bucket: bucket,
                Key: key
            };
            const res = await s3.deleteObject(param).promise();
            return {error: false, message: "success"};
        } catch (e) {
            if (CONFIG.IS_LOCAL) console.log("Delete failed: ", e);
            if (!CONFIG.IS_LOCAL) library.log(e.stack, "DELETEFROMS3SRCV001");
            return {error: true, message: "removeVideoObjectDeleteFailed", error_code: "DELETEFROMS3SRCV001"};
        }
    },

    /**************** ************
     Function name : deleteObjectsFromS3
     Author :
     CreatedDate : 15.11.2021

     Purpose :  Delete Objects From S3
     Params: bucket, key
     *****************************/
    deleteObjectsFromS3: async (Bucket, Keys = []) => {
        /**
         * Delete the list of objects from the specified bucket.
         * @param {string} Bucket is the bucket name from which the objects needs to be deleted.
         * @param {object} Keys is the array of string object keys to be deleted.
         * @returns object of info weather the objects has been deleted or not.
         */
        try {
            if (typeof keys == 'undefined' || !Array.isArray(keys)) {
                return {error: true, message: "", error_code: "DELETEOBJECTSFROMS3SRCV001"};
            }
            const _Objects = Keys.map(k => ({Key: k}));
            const param = {
                Bucket: Bucket,
                Delete: {
                    Objects: _Objects
                }
            };
            const res = await s3.deleteObjects(patam).promise();
            return {error: false, message: "success"};
        } catch (e) {
            if (CONFIG.IS_LOCAL) console.log("Delete failed: ", e);
            if (!CONFIG.IS_LOCAL) library.log(e.stack, "DELETEOBJECTSFROMS3SRCV002");
            return {error: true, message: "errorMsg3", error_code: "DELETEOBJECTSFROMS3SRCV002"};
        }
    },

    /**************** ************
     Function name : deleteS3ObjectAsset
     Author :
     CreatedDate : 15.11.2021

     Purpose :  Delete S3 Object Asset
     Params: object_id, asset_type, bucket
     *****************************/
    deleteS3ObjectAsset: async (object_id, asset_type, bucket) => {
        /**
         *
         * @param object_id
         * @param asset_type
         * @param bucket
         * @returns {Promise<{error: boolean, message: string}|{error_code: string, error: boolean, message: string}>}
         */
        let Key = Constants.AWS_FOLDER[asset_type] ? Constants.AWS_FOLDER[asset_type].join("/") : "";
        Key += `/${object_id}`;
        return await this.deleteFromS3(bucket, Key);
    },

    /**************** ************
     Function name : putBase64Object
     Author :
     CreatedDate : 15.11.2021

     Purpose :  Put Base64 Object
     Params: data, type, Folders, Bucket
     *****************************/
    putBase64Object: async (data, type, Folders, Bucket = process.env.BUCKET_NAME) => {
        /**
         *
         * @param {string} Bucket the bucket name
         * @param {Buffer} data the base 64 encoded data buffer
         * @param {string} type The type of the file
         * @param {Array<string>|string} Folders
         * @returns {Promise<boolean|{location:string, Key:string, object_id:string}>}
         */
        let Key = Folders
        if (Key && Array.isArray(Key) && Key.length > 0) {
            Key = Key.join("/");
        }
        if (!Key) Key = "";
        let objectId = library.getAWSObjectId();
        Key += `/${objectId}.${type}`;
        let content_type = library.extractContentType(type);
        const params = {
            Bucket: Bucket,
            Key: Key, // type is not required
            Body: data,
            // ACL: 'public-read',
            ContentEncoding: 'base64', // required
            ContentType: content_type // required. Notice the back ticks
        };
        try {
            const {Location, Key: _Key} = await s3.upload(params).promise();
            let location = Location;
            Key = _Key;
            return {location, Key, object_id: objectId};
        } catch (e) {
            throw e;
        }
    }
}