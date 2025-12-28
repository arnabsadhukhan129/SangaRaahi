const Services = require("../services");
const ErrorModules = require("../errors");

module.exports = {
  Query: {
    async getAllUploadImage(root, args, context, info) {
      try {
        const result = await Services.EventMemoryService.getAllUploadImage(args.data);
        //   console.log(result,"result..........");
        const Images = Lib.reconstructObjectKeys(
          result.data,
          ["created_at"],
          function (value, key) {
            if (key === "created_at") {
              return Lib.convertDate(value);
            }
            else {
              return value;
            }
          }
        );
        const eventMemoryData = {
          total: result.total,
          from: result.from,
          to: result.to,
          images: Images
        }
        return Lib.resSuccess(eventMemoryData);
      } catch (error) {
        console.error("Error in resolver:", error);
        return {
          error: true,
          code: 500,
          systemCode: 'RESOLVER_ERROR',
          message: error.message,
          data: null
        };
      }
    },
    async getAllUploadedUserImage(root, args, context, info) {
      try {
        const result = await Services.EventMemoryService.getAllUploadedUserImage(args.data);
        //   console.log(result,"result..........");
        const Images = Lib.reconstructObjectKeys(
          result.data,
          ["created_at"],
          function (value, key) {
            if (key === "created_at") {
              return Lib.convertDate(value);
            }
            else {
              return value;
            }
          }
        );
        const eventMemoryData = {
          total: result.total,
          from: result.from,
          to: result.to,
          images: Images
        }
        return Lib.resSuccess(eventMemoryData);
      } catch (error) {
        console.error("Error in resolver:", error);
        return {
          error: true,
          code: 500,
          systemCode: 'RESOLVER_ERROR',
          message: error.message,
          data: null
        };
      }
    },
    orgImageListEventWise: async (root, args, context, info) => {
      try {
        const result = await Services.EventMemoryService.orgImageListEventWise(args.data);
        // console.log(result, "result....................");
    
        const Images = Lib.reconstructObjectKeys(
          result.data,
          ['created_at','image_dead_line'],
          function (value, key) {
            if (key === 'created_at') {
              return Lib.convertDate(value);
            }
            if (key === 'image_dead_line') {
              return Lib.convertDate(value);
            } else {
              return value;
            }
          }
        );
    
        const eventMemoryData = {
          events:Images.data,
        };
        return Lib.resSuccess(eventMemoryData);
      } catch (error) {
        console.error('Error in resolver:', error);
        return {
          error: true,
          code: 500,
          systemCode: 'RESOLVER_ERROR',
          message: error.message,
          data: null,
        };
      }
    },

    orgImageListDateWise: async (root, args, context, info) => {
      try {
        const result = await Services.EventMemoryService.orgImageListDateWise(args.data);
        // console.log(result, "result....................");
    
        const Images = Lib.reconstructObjectKeys(
          result.data,
          ['created_at','image_dead_line'],
          function (value, key) {
            if (key === 'created_at') {
              return Lib.convertDate(value);
            }
            if (key === 'image_dead_line') {
              return Lib.convertDate(value);
            } else {
              return value;
            }
          }
        );
    
        const eventMemoryData = {
          events:Images.data, // Access 'data' directly from 'Images'
        };
        return Lib.resSuccess(eventMemoryData);
      } catch (error) {
        console.error('Error in resolver:', error);
        return {
          error: true,
          code: 500,
          systemCode: 'RESOLVER_ERROR',
          message: error.message,
          data: null,
        };
      }
    }, 
    
    async getUploadImageListCounting(root, args, context, info) {
      const member = await Services.EventMemoryService.getUploadImageListCounting(args.data);
      // console.log(member,"member........");
      let result = Lib.reconstructObjectKeys(member.data);
      return Lib.resSuccess("", result);
    },
  },
  Mutation: {
    async uploadImage(root, args, context, info) {
      const userName = context.user.name;
      const userId = context.user.id;
      const phoneNumber = context.user.phone;
      const logoImage = context.user.profileImage;
      const result = await Services.EventMemoryService.uploadImage(args.data, userName, userId, phoneNumber, logoImage);
      return Lib.sendResponse(result);
    },
    async approveOrRejectImage(root, args, context, info) {
      const result = await Services.EventMemoryService.approveOrRejectImage(args.data);
      return Lib.sendResponse(result);
    },
    async imageStatusChange(root, args, context, info) {
      const id = args.data.imageId;
      const result = await Services.EventMemoryService.imageStatusChange(id);
      return Lib.sendResponse(result);
    },
    async deleteImage(root, args, context, info) {
      const id = args.data.imageId;
      let result = await Services.EventMemoryService.deleteImage(id);
      return Lib.sendResponse(result);
    },
  }
}