const Services = require("../services");

module.exports = {
  Query: {
    async getAllEventPayment(root, args, context, info) {
      const result = await Services.EventPaymentService.getAllEventPayment(args.data);
      const payment = Lib.reconstructObjectKeys(
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
      const paymentData = {
        total: result.total,
        from: result.from,
        to: result.to,
        payment: payment
      }
      return Lib.resSuccess(paymentData);
    },

    async getEventPaymentById(root, args, context, info) {
      const result = await Services.EventPaymentService.getEventPaymentById(args.data);

      // Check if there was an error in fetching payment details
      if (result.error) {
        // Return an error response
        return {
          error: true,
          code: result.code,
          systemCode: result.systemCode,
          message: result.message,
          data: null,
        };
      }

      // Map the service response to the expected GraphQL response
      const data = result.data;
      // Format the createdAt date field
      const formattedCreatedAt = new Date(data.created_at).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      return {
        error: false,
        code: 200,
        systemCode: 'PAYMENT_FETCHED_SUCCESSFULLY',
        message: 'Payment fetched successfully',
        data: {
          paymentStatus: data.payment_status ? data.payment_status : null,
          amount: data.amount ? data.amount : null,
          transactionAmount: data.transaction_amount ? data.transaction_amount : null,
          gatewayChargeCost: data.gateway_charge_cost ? data.gateway_charge_cost : null,
          actualPaymentmtount: data.actual_payment_amtount ? data.actual_payment_amtount : null,
          paymentMode: data.payment_mode ? data.payment_mode : null,
          checkNo: data.check_no ? data.check_no : null,
          transactionId: data.transaction_id ? data.transaction_id : null,
          description: data.description ? data.description : null,
          cardNo: data.card_no ? data.card_no : null,
          currency: data.currency ? data.currency : null,
          createdAt: formattedCreatedAt,
          userId: data.userId ? data.userId : null,
          userName: data.userName ? data.userName : null,
          userEmail: data.userEmail ? data.userEmail : null,
          profileImage: data.profileImage ? data.profileImage : null,
          phoneNumber: data.phoneNumber ? data.phoneNumber : null,
          name: data.name ? data.name : null,
          email: data.email ? data.email : null,
          phone: data.phone ? data.phone : null,
          phoneCode: data.phone_code ? data.phone_code : null,
          memberType: data.member_type ? data.member_type : null,
        },
      };
    },
    async getEventPaymentByIdApp(root, args, context, info) {
      const userId = context.user.id;
      const result = await Services.EventPaymentService.getEventPaymentByIdApp(userId, args.data);
      // Check if there was an error in fetching payment details
      if (result.error) {
        // Return an error response
        return {
          error: true,
          code: result.code,
          systemCode: result.systemCode,
          message: result.message,
          data: null,
        };
      }

      // Map the service response to the expected GraphQL response
      const { payment_status, amount,rsvp_status, transaction_amount, gateway_charge_cost, actual_payment_amtount,
        payment_mode, check_no, transaction_id, description, card_no, currency, package_details, created_at, userName } = result.data;
      // Map packageDetails to include packageId
      const mappedPackageDetails = package_details.map(detail => ({
        packageId: detail.package_id,
        number: detail.number
      }));
      // Format the createdAt date field
      const formattedCreatedAt = new Date(created_at).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return {
        error: false,
        code: 200,
        systemCode: 'PAYMENT_FETCHED_SUCCESSFULLY',
        message: 'Payment fetched successfully',
        data: {
          paymentStatus: payment_status,
          amount: amount,
          rsvpStatus: rsvp_status,
          transactionAmount: transaction_amount,
          gatewayChargeCost: gateway_charge_cost,
          actualPaymentmtount: actual_payment_amtount,
          paymentMode: payment_mode,
          checkNo: check_no,
          transactionId: transaction_id,
          description: description,
          cardNo: card_no,
          currency: currency,
          packageDetails: mappedPackageDetails,
          createdAt: formattedCreatedAt,
          userName: userName,
        },
      };
    },
  },
  Mutation: {
    async deleteEventPayment(root, args, context, info) {
      const id = args.data.paymentId;
      const userId = context.user.id;
      const result = await Services.EventPaymentService.deleteEventPayment(id, userId);
      return Lib.sendResponse(result);
    },
    async updateEventPayment(root, args, context, info) {
      const result = await Services.EventPaymentService.updateEventPayment(args.data, context);
      return Lib.sendResponse(result);
    },
    async updateCheckIn(root, args, context, info) {
      const id = args.data.paymentId;
      const userId = context.user.id;
      // console.log(io,"io........");
      const result = await Services.EventPaymentService.updateCheckIn(id, userId);
      return Lib.sendResponse(result);
    }
  },
}