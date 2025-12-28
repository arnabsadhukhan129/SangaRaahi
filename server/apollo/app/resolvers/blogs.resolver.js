const Services = require("../services");
const ErrorModules = require("../errors");

module.exports = {
    Query: {
        async getAllBlogs(root, args, context, info) {
            try{
                const result = await Services.BlogsService.getAllBlogs(args.data,context.user);
                const blogs = Lib.reconstructObjectKeys(
                    result.data,
                    // ["created_at"],
                    // function (value, key) {
                    //   if (key === "created_at") {
                    //     return Lib.convertDate(value);
                    //   }
                    //   else {
                    //     return value;
                    //   }
                    // }
                  );
                  // return Lib.sendResponse(result);
                  const blogData = {
                    total: result.total,
                    from: result.from,
                    to: result.to,
                    blogs: blogs
                  }
                  return Lib.resSuccess(blogData);

            }catch (error) {
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
        async getAllBlogsForApp(root, args, context, info) {
          try{
              const result = await Services.BlogsService.getAllBlogs(args.data,context.user);
              const blogs = Lib.reconstructObjectKeys(
                  result.data,
                  // ["created_at"],
                  // function (value, key) {
                  //   if (key === "created_at") {
                  //     return Lib.convertDate(value);
                  //   }
                  //   else {
                  //     return value;
                  //   }
                  // }
                );
                // return Lib.sendResponse(result);
                const blogData = {
                  total: result.total,
                  from: result.from,
                  to: result.to,
                  blogs: blogs
                }
                return Lib.resSuccess(blogData);

          }catch (error) {
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
        async getBolgsById(root, args, context, info) {
            const result = await Services.BlogsService.getBolgsById(args.data,context)
            console.log(result,"result...........");
            return Lib.sendResponse(result);
        }
    },
    Mutation: {
        async createBlogs(root,args,context,info) {
          const userId = context.user.id;
            const result = await Services.BlogsService.createBlogs(args.data,context.user,userId);
            return Lib.sendResponse(result);
        },
        async updateblogs (root,args,context,info){
            // const id = args.data.blogId;
            const userId = context.user.id
            const result = await Services.BlogsService.updateblogs(args.data, userId);
            return Lib.sendResponse(result);
        },
        async deleteBlogs(root, args, context, info){
            const id = args.data.blogId;
            const result = await Services.BlogsService.deleteBlogs(id);
            return Lib.sendResponse(result);
        },
        async blogStatusChange(root, args, context, info) {
            const id = args.data.blogId;
            const result = await Services.BlogsService.blogStatusChange(id);
            return Lib.sendResponse(result);
          },
        async blogPaymentStatusChange(root, args, context, info) {
            const id = args.data.blogId;
            const result = await Services.BlogsService.blogPaymentStatusChange(id);
            return Lib.sendResponse(result);
        }
    }
}