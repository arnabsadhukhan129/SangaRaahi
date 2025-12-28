const Communities = Lib.Model('Communities');
const EventPayments = Lib.Model('EventPayment');
const Events = Lib.Model('Events');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

module.exports = {
    // Analytics by Event Type
    getParticipationByEventTpe: async (data, logInUserId) => {
        try {
            const communityId = data.communityId;
            const userId = data.userId ? data.userId : logInUserId;
            const startDate = data.startDate ? new Date(data.startDate) : null;
            const endDate = data.endDate ? new Date(data.endDate) : null;

            let filter = { is_deleted: false, is_active: true };
            if (communityId) filter.community_id = ObjectId(communityId);
            // if (userId) filter.user_id = ObjectId(userId);

            const pipeline = [
                { $match: filter },
                { $unwind: "$rsvp" },
                ...(startDate && endDate
                    ? [{
                        $match: {
                            "created_at": {
                                $gte: new Date(startDate),
                                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
                            }
                        }
                    }]
                    : []
                ),
                {
                    $match: {
                        "rsvp.user_id": ObjectId(userId),
                        "rsvp.status": "Attending"
                    }
                },
                {
                    $group: {
                        _id: "$type",
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        type: "$_id",
                        count: 1,
                    },
                },
            ];

            const result = await Events.aggregate(pipeline);

            const allTypes = ["Religious", "Educational", "Cultural", "Social", "Health", "Other"];
            const finalData = allTypes.map((type) => {
                const found = result.find((r) => r.type === type);
                return { type, count: found ? found.count : 0 };
            });
            return {
                error: false,
                message: "generalSuccess",
                data: finalData
            }

        } catch (err) {
            console.log(err)
        }
    },

    getEventParticipationByUser: async (data, logInUserId) => {
        try {
            const communityId = data.communityId;
            const userId = data.userId ? data.userId : logInUserId;
            const startDate = data.startDate ? new Date(data.startDate) : null;
            const endDate = data.endDate ? new Date(data.endDate) : null;

            let filter = { is_deleted: false, is_active: true };
            if (communityId) filter.community_id = ObjectId(communityId);

            const pipeline = [
                { $match: filter },
                { $unwind: "$rsvp" },
                ...(startDate && endDate
                    ? [{
                        $match: {
                            "created_at": {
                                $gte: new Date(startDate),
                                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
                            }
                        }
                    }]
                    : []
                ),
                {
                    $match: {
                        "rsvp.user_id": ObjectId(userId),
                        "rsvp.status": "Attending"
                    }
                },
                {
                    $group: {
                        _id: "$community_id",
                        count: { $sum: 1 },
                    },
                },
                {
                    $lookup: {
                        from: "sr_communities",
                        localField: "_id",
                        foreignField: "_id",
                        as: "community"
                    }
                },
                { $unwind: { path: "$community", preserveNullAndEmptyArrays: true } },
                {
                    $match: {
                        "community.is_deleted": false,
                        "community.is_active": true,
                        "community.members": {
                            $elemMatch: {
                                member_id: ObjectId(userId),
                                acknowledgement_status: "Accepted",
                                is_deleted: false,
                                is_leaved: false
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        communityName: "$community.community_name",
                        count: 1
                    }
                }
            ];

            const result = await Events.aggregate(pipeline);

            return {
                error: false,
                message: "generalSuccess",
                data: result
            };

        } catch (error) {
            console.error("Error in getEventParticipationByUser:", error);
            return {
                error: true,
                message: error.message,
                data: []
            };
        }
    },

    getCommunityContribution: async (data, logInUserId) => {
        try {
            const { startDate, endDate, userId } = data;

            const finalUserId = userId || logInUserId;

            // Date filtering if provided
            const dateFilter = {};
            if (startDate && endDate) {
                dateFilter.created_at = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            const communities = await Communities.find(
                {
                    members: {
                        $elemMatch: {
                            member_id: new mongoose.Types.ObjectId(finalUserId),
                            acknowledgement_status: "Accepted",
                            is_deleted: false,
                            is_leaved: false
                        }
                    }
                },
                {
                    community_name: 1
                }
            );

            const communityIds = communities.map(c => c._id);

            const payments = await EventPayments.aggregate([
                {
                    $match: {
                        user_id: new mongoose.Types.ObjectId(finalUserId),
                        event_id: { $ne: null },
                        ...dateFilter
                    }
                },
                {
                    $lookup: {
                        from: `${Lib.ENV('DB_PREFIX')}events`,
                        localField: "event_id",
                        foreignField: "_id",
                        as: "event"
                    }
                },
                { $unwind: "$event" },
                {
                    $group: {
                        _id: "$event.community_id",
                        totalContribution: { $sum: "$amount" },
                        currency: { $first: "$currency" }
                    }
                }
            ]);

            const contributionMap = {};
            payments.forEach(p => {
                contributionMap[p._id?.toString()] = p.totalContribution;
            });

            const responseList = communities.map(c => ({
                communityId: c._id,
                communityName: c.community_name,
                totalContribution: contributionMap[c._id.toString()] || 0,
                currency: payments.length > 0 ? payments[0].currency : null
            }));

            const totalContribution = responseList.reduce(
                (sum, item) => sum + item.totalContribution,
                0
            );

            const detectedCurrency = payments.length > 0 ? payments[0].currency : null;

            return {
                error: false,
                message: "generalSuccess",
                data: responseList,
                totalContribution: totalContribution,
                currency: detectedCurrency
            };

        } catch (err) {
            console.log("Service error:", err);
            return {
                error: true,
                message: "SERVICE_ERROR",
                data: []
            };
        }
    },

    getCurrentCommunityContribution: async (data, logInUserId) => {
        try {
            const { startDate, endDate, communityId, userId } = data;

            const finalUserId = userId || logInUserId;

            // Date filtering if provided
            const dateFilter = {};
            if (startDate && endDate) {
                dateFilter.created_at = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            const community = await Communities.findOne(
                {
                    _id: ObjectId(communityId),
                    members: {
                        $elemMatch: {
                            member_id: new mongoose.Types.ObjectId(finalUserId),
                            acknowledgement_status: "Accepted",
                            is_deleted: false,
                            is_leaved: false
                        }
                    }
                },
                {
                    community_name: 1
                }
            );

            if (!community) {
                return {
                    error: true,
                    message: "COMMUNITY_NOT_FOUND",
                    data: []
                };
            }

            const payments = await EventPayments.aggregate([
                {
                    $match: {
                        user_id: new mongoose.Types.ObjectId(finalUserId),
                        event_id: { $ne: null },
                        ...dateFilter
                    }
                },
                {
                    $lookup: {
                        from: `${Lib.ENV('DB_PREFIX')}events`,
                        localField: "event_id",
                        foreignField: "_id",
                        as: "event"
                    }
                },
                { $unwind: "$event" },
                {
                    $match: {
                        "event.community_id": ObjectId(communityId)
                    }
                },
                {
                    $group: {
                        _id: "$event.community_id",
                        totalContribution: { $sum: "$amount" },
                        currency: { $first: "$currency" }
                    }
                }
            ]);

            const totalContribution = payments.length > 0 ? payments[0].totalContribution : 0;
            const detectedCurrency = payments.length > 0 ? payments[0].currency : null;

            return {
                error: false,
                message: "generalSuccess",
                data: [
                    {
                        communityId: community._id,
                        communityName: community.community_name,
                        totalContribution: totalContribution,
                        currency: detectedCurrency
                    }
                ],
                totalContribution: totalContribution,
                currency: detectedCurrency
            };
        } catch (err) {
            console.log("Service error:", err);
            return {
                error: true,
                message: "SERVICE_ERROR",
                data: []
            };
        }
    },

    getMySpentAmountByMonth: async (data, logInUserId) => {
        try {
            const { startDate, endDate, communityId, userId } = data;

            const finalUserId = userId || logInUserId;

            const monthNames = [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ];

            const dateFilter = {};
            let useLastThreeMonths = false;

            if (startDate || endDate) {
                dateFilter.created_at = {};
                if (startDate) dateFilter.created_at.$gte = new Date(startDate);
                if (endDate) dateFilter.created_at.$lte = new Date(endDate);
            } else {
                useLastThreeMonths = true;

                const now = new Date();
                const past3 = new Date();
                past3.setMonth(now.getMonth() - 3);

                dateFilter.created_at = {
                    $gte: new Date(past3.setDate(1)),
                    $lte: now
                };
            }

            let finalCurrency = null;

            if (communityId) {
                const comm = await Communities.findById(communityId, { currency: 1 });
                finalCurrency = comm?.currency || null;
            } else {
                const userCommunities = await Communities.find(
                    { "members.member_id": ObjectId(finalUserId) },
                    { currency: 1 }
                );
                finalCurrency = userCommunities?.[0]?.currency || null;
            }

            const pipeline = [
                {
                    $match: {
                        user_id: new mongoose.Types.ObjectId(finalUserId),
                        event_id: { $ne: null },
                        ...dateFilter
                    }
                },

                {
                    $lookup: {
                        from: `${Lib.ENV("DB_PREFIX")}events`,
                        localField: "event_id",
                        foreignField: "_id",
                        as: "event"
                    }
                },
                { $unwind: "$event" },

                ...(communityId
                    ? [{ $match: { "event.community_id": ObjectId(communityId) } }]
                    : []),

                {
                    $lookup: {
                        from: `${Lib.ENV("DB_PREFIX")}communities`,
                        localField: "event.community_id",
                        foreignField: "_id",
                        as: "community"
                    }
                },
                { $unwind: "$community" },

                {
                    $group: {
                        _id: {
                            year: { $year: "$created_at" },
                            month: { $month: "$created_at" }
                        },
                        totalAmount: { $sum: "$amount" },
                        currency: { $first: "$community.currency" }
                    }
                },

                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ];

            const result = await EventPayments.aggregate(pipeline);

            if (!useLastThreeMonths && startDate && endDate) {
                const finalData = [];

                let start = new Date(startDate);
                start = new Date(start.getFullYear(), start.getMonth(), 1);

                let end = new Date(endDate);
                end = new Date(end.getFullYear(), end.getMonth(), 1);

                const dbMap = {};
                result.forEach(r => {
                    const key = `${r._id.month}-${r._id.year}`;
                    dbMap[key] = {
                        totalAmount: r.totalAmount,
                        currency: r.currency
                    };
                });

                while (start <= end) {
                    const key = `${start.getMonth() + 1}-${start.getFullYear()}`;

                    finalData.push({
                        month: `${monthNames[start.getMonth()]} ${start.getFullYear()}`,
                        totalSpentAmmount: dbMap[key]?.totalAmount || 0,
                        currency: dbMap[key]?.currency || finalCurrency
                    });

                    start.setMonth(start.getMonth() + 1);
                }

                return {
                    error: false,
                    message: "generalSuccess",
                    data: finalData
                };
            }

            function getLastMonths(count = 3) {
                const today = new Date();
                const arr = [];
                for (let i = count - 1; i >= 0; i--) {
                    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    arr.push({
                        key: `${d.getMonth() + 1}-${d.getFullYear()}`,
                        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`
                    });
                }
                return arr;
            }

            const last3Months = getLastMonths();

            const dbMap = {};
            result.forEach(r => {
                const key = `${r._id.month}-${r._id.year}`;
                dbMap[key] = {
                    totalAmount: r.totalAmount,
                    currency: r.currency
                };
            });

            const formatted = last3Months.map(m => ({
                month: m.label,
                totalSpentAmmount: dbMap[m.key]?.totalAmount || 0,
                currency: dbMap[m.key]?.currency || finalCurrency
            }));

            return {
                error: false,
                message: "generalSuccess",
                data: formatted
            };

        } catch (err) {
            console.error(err);
            return {
                error: true,
                message: "SERVICE_ERROR",
                data: []
            };
        }
    }
}