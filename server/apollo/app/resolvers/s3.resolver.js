const Services = require('../services');
const ErrorModules = require('../errors');
module.exports = {
    Query:{
        async getAmazonS3Creds(root, args, context, info) {
            //console.log("Here")
            let result = await Services.S3Service.getAmazonS3Creds();
            return Lib.resSuccess("",result);
        },
    },
    Mutation: {
        async generateS3UploadURL(root, args, context, info) {
            //console.log(args,'params');
            let result = await Services.S3Service.generateS3UploadURL(args);
           //console.log(result.data,`line 15 resolver`)
            return Lib.resSuccess("",result.data);
        },
    }
}