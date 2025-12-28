const Services = require("../services");
const ErrorModules = require("../errors");
const notificationHelper = require('../library/notifiaction.helper')
const notificationServices = require('../services/notification.service');

module.exports = {
  Query: {
    async getAllEventSupplierManagement(root, args, context, info) {
      try {
        const result = await Services.EventSupplierManagementService.getAllEventSupplierManagement(args.data);
        const orders = Lib.reconstructObjectKeys(
          result.data,
          ["required_date"],
          function (value, key) {
            if (key === "required_date") {
              return Lib.convertIsoDate(value);
            }
            else {
              return value;
            }
          }
        );
        // return Lib.sendResponse(result);
        const ordersData = {
          total: result.total,
          from: result.from,
          to: result.to,
          orders: orders
        }
        return Lib.resSuccess(ordersData);
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
    async getAllEventSupplierManagementForApp(root, args, context, info) {
      const userId = context.user.id;
      try {
        const result = await Services.EventSupplierManagementService.getAllEventSupplierManagementForApp(userId,args.data);
        const orders = Lib.reconstructObjectKeys(
          result.data,
          ["required_date"],
          function (value, key) {
            if (key === "required_date") {
              return Lib.convertIsoDate(value);
            }
            else {
              return value;
            }
          }
        );
        // return Lib.sendResponse(result);
        const ordersData = {
          total: result.total,
          from: result.from,
          to: result.to,
          orders: orders
        }
        return Lib.resSuccess(ordersData);
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
    async getEventSupplierById(root, args, context, info) {
      try {
        const result = await Services.EventSupplierManagementService.getEventSupplierById(args.data);
        // console.log(result,"result..........");
        const orders = Lib.reconstructObjectKeys(
          result.data,
          ["required_date"],
          function (value, key) {
            if (key === "required_date") {
              return Lib.convertDate(value);
            }
            else {
              return value;
            }
          }
        );
        // return Lib.sendResponse(result);
        const ordersData = {
          orders: orders
        }
        return Lib.resSuccess(ordersData);
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
    async getSupplierStatusCounting(root, args, context, info) {
      const member = await Services.EventSupplierManagementService.getSupplierStatusCounting(args.data);
      // console.log(member,"member........");
      let result = Lib.reconstructObjectKeys(member.data);
      return Lib.resSuccess("", result);
    },
    async acceptOrRejectSupplierUserList(root, args, context, info) {
      try {
        const result = await Services.EventSupplierManagementService.acceptOrRejectSupplierUserList(args.data);
        const AcceptOrRejectUser = Lib.reconstructObjectKeys(
          result.data,
          ["accepted_date"],
          function (value, key) {
            if (key === "accepted_date") {
              return Lib.convertDate(value);
            }
            else {
              return value;
            }
          }
        );
        return {
          error: false,
          systemCode: 'SUCCESS',
          code: 200,
          message: 'generalSuccess',
          data: AcceptOrRejectUser 
      };      
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
    async getSupplierLogHistory(root, args, context, info) {
      try {
        const data = args.data;
        const result = await Services.EventSupplierManagementService.getSupplierLogHistory(data);
        let logList = Lib.reconstructObjectKeys(
          result.data,
          ["acceptedDate"],
          function (value, key) {
            if (key === "acceptedDate") {
              return Lib.convertDate(value);
            }
            else {
              return value;
            }
          }
        );
        return {
          error: false,
          systemCode: "SUCCESS",
          code: 200,
          message: 'generalSuccess',
          data: logList
        }
      } catch (error) {
        console.error("Error:", error)
        return {
          error: false,
          code: 500,
          systemCode: 'RESOLVER_ERROR',
          message: error.message,
          data: null
        }
      }
    }
  },
  Mutation: {
    async createEventSupplierManagement(root, args, context, info) {
      let id = context.user.selectedOrganizationPortal;
      const userName = context.user.name;
      let userId = context.user.id;
      const result = await Services.EventSupplierManagementService.createEventSupplierManagement(userName, args.data, userId);

      //Notification.....
      // if (result && !result.error) {
      //   const slug = 'quantity-for-event';
      //   const lang = 'en';
      //   await notificationHelper.getFcmTokens(user.id, slug, lang);
      // }
      return Lib.sendResponse(result);
    },
    async updateEventSupplierManagement(root, args, context, info) {
      const communityId = context.user.selectedOrganizationPortal;
      const id = args.data.id;
      const result = await Services.EventSupplierManagementService.updateEventSupplierManagement(id, args.data, context,communityId);
      return Lib.sendResponse(result);
    },
    async updateEventSupplierManagementQuantity(root, args, context, info) {
      let userId = context.user.id;
      const communityId = context.user.selectedOrganizationPortal;
      const id = args.data.id;
      const result = await Services.EventSupplierManagementService.updateEventSupplierManagementQuantity(id, args.data, context,communityId, userId);
      return Lib.sendResponse(result);
    },
    async deleteEventSupplierManagement(root, args, context, info) {
      const userId = context.user.id;
      let result = await Services.EventSupplierManagementService.deleteEventSupplierManagement(args.data,userId);
      return Lib.sendResponse(result);
    },
    async assignSupplierMembers(root, args, context, info) {
      // const communityId = context.user.selectedOrganizationPortal;
      // let user = context.user;
      // const orders = await Services.EventSupplierManagementService.getAllEventSupplierManagement(args.data);
      // // console.log(orders.data, "orders.................")
      // const targetOrder = orders.data.find(order => order._id.toString() === args.data.supplierId);
      // if (!targetOrder) {
      //   // Handle case where no matching order is found, perhaps throw an error or return
      //   throw new Error('Supplier not found.');
      // }
      // const useFind =
      //   await Services.UserService.getUserByID(
      //     context.getAuthUserInfo(),
      //     communityId
      //   );
      const logInUser = context.user.id;
      const result = await Services.EventSupplierManagementService.assignSupplierMembers(args.data, logInUser);
      // if (result && !result.error) {
      //   const payload = {
      //     recipient:
      //     {
      //       user_id: user.id,
      //       fcmToken: useFind.data.device_details.map(device => device.web_token).filter(Boolean)
      //     },
      //     template: {
      //       type: "All",
      //       slug: "assignsupplier-members",
      //       lang: "en"
      //     },
      //     contents: {
      //       ADMINNAME: user.name,
      //       EVENT: targetOrder.needed_for

      //     }
      //   }
      //   await notificationServices.notifyService(payload);
      // }
      return Lib.sendResponse(result);
    },
    async deleteAssignSupplierMembers(root, args, context, info) {
      const logInUser = context.user.id;
      let result = await Services.EventSupplierManagementService.deleteAssignSupplierMembers(args.data, logInUser);
      return Lib.sendResponse(result);
    },
    async acceptOrRejectSupplierManagement(root, args, context, info) {
      let userId = context.user.id;
      let result = await Services.EventSupplierManagementService.acceptOrRejectSupplierManagement(userId, args.data);
      return Lib.sendResponse(result);
    },
    async selfVolunteerSupplier(root, args, context, info) {
      const userId = context.user.id;
      const result = await Services.EventSupplierManagementService.selfVolunteerSupplier(userId,args.data);
      return Lib.sendResponse(result);
    },
    async adminQuantityStatusChange(root, args, context, info) {
      const data = args.data;
      const logInUser = context.user.id;
      const result = await Services.EventSupplierManagementService.adminQuantityStatusChange(data, logInUser);
      return Lib.sendResponse(result);
    }
  }
}