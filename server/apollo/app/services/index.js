/*
 * Not using the auto import for ease of indexing in the IDE and go to the method definition with just the click.
 */
const UserService = require('./user.service');
const AuthService = require('./auth.service');
const AnnouncementService = require('./announcement.service');
const GroupService = require('./group.service');
const CommunityService = require('./community.service');
const EventService = require('./event.service');
const S3Service = require('./s3.service');
const NotificationService = require('./notification.service');
const FeedbackService = require('./feedback.service');
const OrganizationService = require('./organiztion.service');
const PassiveUserService = require('./passiveUser.service');
const GroupOrganizationService = require('./group_organization.service');
const EventOrganizationService = require('./event_organization.service');
const CommunityFeedbackService = require('./community_feedback.service');
const AnnouncementOrganization = require('./announcement_organization.service')
const CommunityWebpageService = require('./community_webpage.service');
const VideoService = require('./video.service');
const CommunityPaymentService = require('./payment.service');
const SmsEmailCreditService = require('./smsEmailCredit.service');
const EventTaskService = require('./event_task.service');
const EventSupplierManagementService = require('./event_supplier_management.service');
const BlogsService = require('./blogs.service');
const EventMemoryService = require('./event_memory.service');
const EventPaymentService = require('./event_payment.service');
const BlogCornService = require('./blog_corn.service');
const EventCornService = require('./event_cron.service');
const HelperService = require('./helper.service');
const MailTemplates = require('./mail_templates.service');
const MailListService = require('./mail_list.service');
const DistanceService = require('./distance.service');
const RolePermissionService = require('./role_permission.service');
const EventImmediateCronService = require('./cron.service');
const ActivityLogService = require('./activity_log.service');
const AnalyticsService = require('./analytics.service');
module.exports = {
    UserService,
    AuthService,
    AnnouncementService,
    GroupService,
    CommunityService,
    EventService,
    S3Service,
    NotificationService,
    FeedbackService,
    OrganizationService,
    PassiveUserService,
    GroupOrganizationService,
    EventOrganizationService,
    CommunityFeedbackService,
    AnnouncementOrganization,
    CommunityWebpageService,
    VideoService,
    CommunityPaymentService,
    SmsEmailCreditService,
    EventTaskService,
    EventSupplierManagementService,
    BlogsService,
    EventMemoryService,
    EventPaymentService,
    BlogCornService,
    EventCornService,
    HelperService,
    MailTemplates,
    MailListService,
    DistanceService,
    RolePermissionService,
    EventImmediateCronService,
    ActivityLogService,
    AnalyticsService
};
