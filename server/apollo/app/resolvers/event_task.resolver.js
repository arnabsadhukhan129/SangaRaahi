const Services = require("../services");
const ErrorModules = require("../errors");
const notificationServices = require('../services/notification.service');

module.exports = {
  Query: {
    async getAllEventTask(root, args, context, info) {
      try {
        const result = await Services.EventTaskService.getAllEventTasks(args.data);
        const tasks = Lib.reconstructObjectKeys(
          result.data,
          ["task_start_date", "task_deadline"],
          function (value, key) {
            if (key === "task_start_date") {
              return Lib.convertIsoDate(value);
            } else if (key === "task_deadline") {
              return Lib.convertIsoDate(value);
            }
            else {
              return value;
            }
          }
        );
        const taskData = {
          total: result.total,
          from: result.from,
          to: result.to,
          tasks: tasks
        }
        return Lib.resSuccess(taskData);
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
    async getAllEventTaskForApp(root, args, context, info) {
      const userId = context.user.id;
      try {
        const result = await Services.EventTaskService.getAllEventTaskForApp(userId,args.data);
        const tasks = Lib.reconstructObjectKeys(
          result.data,
          ["task_start_date", "task_deadline"],
          function (value, key) {
            if (key === "task_start_date") {
              return Lib.convertIsoDate(value);
            } else if (key === "task_deadline") {
              return Lib.convertIsoDate(value);
            }
            else {
              return value;
            }
          }
        );
        const taskData = {
          total: result.total,
          from: result.from,
          to: result.to,
          tasks: tasks
        }
        return Lib.resSuccess(taskData);
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
    async getEventTaskById(root, args, context, info) {
      try {
        const result = await Services.EventTaskService.getEventTaskById(args.data);
        // console.log(result,"result..........");
        const tasks = Lib.reconstructObjectKeys(
          result.data,
          ["task_start_date", "task_deadline"],
          function (value, key) {
            if (key === "task_start_date") {
              return Lib.convertDate(value);
            } else if (key === "task_deadline") {
              return Lib.convertDate(value);
            }
            else {
              return value;
            }
          }
        );
        // return Lib.sendResponse(result);
        const taskData = {
          tasks: tasks
        }
        return Lib.resSuccess(taskData);
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
    async getUserVisibility(root, args, context, info) {
      const member = await Services.EventTaskService.getUserVisibility(args.data);
      // console.log(member,"member........");
      let result = Lib.reconstructObjectKeys(member.data);
      return Lib.resSuccess("", result);
    },
    async getTaskStatusCounting(root, args, context, info) {
      const member = await Services.EventTaskService.getTaskStatusCounting(args.data);
      // console.log(member,"member........");
      let result = Lib.reconstructObjectKeys(member.data);
      return Lib.resSuccess("", result);
    },
    async acceptOrRejectUserList(root, args, context, info) {
      try {
        const result = await Services.EventTaskService.acceptOrRejectUserList(args.data);
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
  },
  Mutation: {
    async createEventTask(root, args, context, info) {
      const userId = context.user.id;
      const userName = context.user.name;
      const result = await Services.EventTaskService.createEventTask(userId,userName,args.data);
      return Lib.sendResponse(result);
    },
    async updateEventTask(root, args, context, info) {
      const communityId = context.user.selectedOrganizationPortal;
      const result = await Services.EventTaskService.updateEventTask(args.data, context,communityId);
      return Lib.sendResponse(result);
    },
    async deleteEventTask(root, args, context, info) {
      const userId = context.user.id;
      const id = args.data.taskId;
      let result = await Services.EventTaskService.deleteEventTask(id, userId);
      return Lib.sendResponse(result);
    },
    async eventTaskStatusChange(root, args, context, info) {
      const userId = context.user.id;
      const result = await Services.EventTaskService.eventTaskStatusChange(args.id, userId);
      return Lib.sendResponse(result);
    },
    async assignMembers(root, args, context, info) {
      const communityId = context.user.selectedOrganizationPortal;
      let logInUser = context.user.id;
      const task = await Services.EventTaskService.getAllEventTasks(args.data);
      const targetTask = task.data.find(task => task._id.toString() === args.data.taskId);
      if (!targetTask) {
        throw new Error('Supplier not found.');
      }
      const useFind =
        await Services.UserService.getUserByID(
          context.getAuthUserInfo(),
          communityId
        );
      const result = await Services.EventTaskService.assignMember(args.data, logInUser);
      // if (result && !result.error) {
      //   const payload = {
      //     recipient:
      //     {
      //       user_id: user.id,
      //       fcmToken: useFind.data.device_details.map(device => device.web_token).filter(Boolean)
      //     },
      //     template: {
      //       type: "All",
      //       slug: "assigntask-members",
      //       lang: "en"
      //     },
      //     contents: {
      //       ADMINNAME: user.name,
      //       TASK: targetTask.task_name

      //     }
      //   }
      //   await notificationServices.notifyService(payload);
      // }
      return Lib.sendResponse(result);
    },
    async deleteAssignMember(root, args, context, info) {
      const logInUser = context.user.id;
      let result = await Services.EventTaskService.deleteAssignMember(args.data, logInUser);
      return Lib.sendResponse(result);
    },
    async acceptOrRejectTask(root,args,context,info) {
      let userId = context.user.id;
      let result = await Services.EventTaskService.acceptOrRejectTask(userId,args.data);
      return Lib.sendResponse(result);
    },
    async selfVolunteer(root, args, context, info) {
      const userId = context.user.id;
      const result = await Services.EventTaskService.selfVolunteer(userId,args.data);
      return Lib.sendResponse(result);
    },
  },
}