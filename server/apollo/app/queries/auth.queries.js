module.exports = function(gql) {
    return gql`
        type AuthUser {
            id: String,
            name: String,
            email: String,
            phone: String,
            phoneCode: String,
            countryCode: String,
            userType: String,
            profileImage: String,
            gender: String,
            dateOfBirth: DateOfBirthType,
            selectedCommunity: String
        }

        type Token {
            accessToken: String!,
            refreshToken: String
        }

        type RegisterByPhone {
            token: Token,
            phone: String,
            login:Boolean,
            selectedCommunity: String,
            communityName:String
            logoImage:String
            communityId:String
        }

        type RegisterUser {
            token:Token,
            user:AuthUser
        }

        type OtpStatus {
            status: Boolean!
            causeOfAction:String
            token: Token!
            user:AuthUser
            role:String
            roleKey:String
            communityName:String
            logoImage:String
            communityId:String
            orgCurrency: String
        }

        type AuthData {
            token: Token,
            user: AuthUser
        }

        type Jtoken {
            token: String
        }
        ## Response Type Construct
        type AuthResponse implements Response {
            error:Boolean,
            systemCode:String,
            code: Int,
            message: String,
            data: AuthData
        }
        
        type RegiaterByPhoneResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: RegisterByPhone
        }
        
        type RegisterUserResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: RegisterUser
        }
        
        type VerifyOtpResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: OtpStatus
        }   

        type AdminPassChangeResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String
        }

        
        type AdminForgotPassResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: Jtoken
        }

        type AdminResetPassResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String
        }

        type verifyAdminPasswordResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: OtpStatus
        }
        
        # type ResendOtpResponse implements Response {
        #     error:Boolean,
        #     systemCode:String,
        #     code:Int,
        #     message:String,
        #     data: OtpStatus
        # }

        ## Response Type Construct End
        
        input InputToken {
            token:String!
        }

        input InputUser {
            name: String,
            yearOfBirth: String
            profileImage:String
            phone: String,
            countryCode: String,
            phoneCode: String,
            email: String,
            code: Int
            fcmToken: String
            webToken: String
            deviceId: String
            deviceType: String
            isOrgPortal: Boolean
            isAppPortal: Boolean
        }

        input AdminLogin {
            email:String!,
            password: String!
            webToken: String
            deviceType: String
        }

        input InputAdminPassChange {
            newPassword: String!,
            confirmPassword:String!
        }

        input InputAdminForgotPassword {
            email: String!
        }

        input InputAdminResetPassword {
            token: String,
            newPassword: String,
            confirmPassword: String,
            
        }

        input ResendOtp {
            token:String!
            isAppPortal: Boolean
        }
        
        input OtpInput {
            otp: Int,
            isAppPortal: Boolean
        }
        
        input smsAppOtpInput {
            phone: String,
            otp:Int
        }

        input InputAdminVerifyPassword {
            otp: Int
        }
        input DotNetSignUpInput {
            user: InputUser
            community: CommunityInput
        }
        input InputSmsApp {
            phoneCode: String,
            phone: String
        }
        extend type Query  {
            testSMS: GeneralResponse
        }
        
        extend type Mutation {
            # Admin Login
            adminLogin(data: AdminLogin): AuthResponse
            # Admin Password Change
            adminPasswordChange(data: InputAdminPassChange): AdminPassChangeResponse
            # Admin Forgot Password
            adminForgotPassword(data: InputAdminForgotPassword): AdminForgotPassResponse
            # Admin Reset Password
            adminResetPassword(data: InputAdminResetPassword): AdminResetPassResponse
            # Admin otp verify
            verifyAdminPasswordOtp(data: InputAdminVerifyPassword): AuthResponse
            # Admin resend otp
            adminPasswordResendOtp : GeneralResponse
            # User registration
            ## Step 1
            registerByPhone(data: InputUser): RegiaterByPhoneResponse
            ## Step 2
            registerUserDetails(data: InputUser): RegisterUserResponse
            ## Step 3
            verifyOtp(data: OtpInput): VerifyOtpResponse
            ## Step 4 (Extra Step)
            resendOtp(data:ResendOtp): VerifyOtpResponse

            ## sms app login
            smsAppLogIn(data: InputSmsApp): RegiaterByPhoneResponse
            ## sms app verify Otp
            smsAppVerifyOtp(data: smsAppOtpInput): VerifyOtpResponse
            ## verify sms app by web
            smsAppVerifyByWeb(data: InputSmsApp): GeneralResponse
            ## verify Sms App Otp By web
            smsAppOtpVerifyByWeb(data: smsAppOtpInput): GeneralResponse

            # .net sign-up
            userDotNetSignUp(data:DotNetSignUpInput): GeneralResponse

            logout:GeneralResponse
            
            clearAuthentication:GeneralResponse
            
        }
    
    `
}