/**
 * The type Announcement
 */

 module.exports = function(gql) {
    return gql`
        ## Type Construct Start
        type S3URL {
            url: String,
            Key: String,
        }

        type S3Creds {
            region: String,
            accessKeyId: String,
            secretAccessKey: String,
            signatureVersion: String,
            bucket: String,
            awsPath: String,
            poolId: String,
        }
        
        ## Type Construct End



        ## Input Construct 
        input InputS3Details {
            bucket:String, 
            folderList:[String],
            type:S3FileType
        }

        
        ## Input Construct End




        ## Response Type Construct Start

        type InsertS3Response implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: S3URL
        }
        
        type getAmazonS3CredsResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: S3Creds
        }
        ## Response Type Construct End



        extend type Query{
            getAmazonS3Creds : getAmazonS3CredsResponse
        }

        extend type Mutation {
            generateS3UploadURL(data:InputS3Details): InsertS3Response
        }
    `
}