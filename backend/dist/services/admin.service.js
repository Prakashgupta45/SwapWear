"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = exports.SAFE_ADMIN_USER_SELECT = void 0;
const prisma_1 = require("../config/prisma");
const auth_service_1 = require("./auth.service");
const client_1 = require("@prisma/client");
exports.SAFE_ADMIN_USER_SELECT = {
    id: true,
    name: true,
    email: true,
    role: true,
    bio: true,
    city: true,
    state: true,
    pincode: true,
    avatarUrl: true,
    createdAt: true,
    updatedAt: true,
};
class AdminService {
    /**
     * 1. Platform Analytics
     * Calculates aggregated metrics directly in the database without loading all records into memory.
     */
    static async getPlatformAnalytics() {
        const [totalUsers, activeUsers, totalListings, availableListings, reservedListings, swappedListings, totalSwaps, pendingSwaps, acceptedSwaps, rejectedSwaps, cancelledSwaps, completedSwaps, totalMessages, recentUsers, recentListings, recentSwaps,] = await Promise.all([
            // 1. Total users
            prisma_1.prisma.user.count(),
            // 2. Active users: users with at least 1 listing, swap request, or message
            prisma_1.prisma.user.count({
                where: {
                    OR: [
                        { listings: { some: {} } },
                        { sentSwapRequests: { some: {} } },
                        { receivedSwapRequests: { some: {} } },
                        { messages: { some: {} } },
                    ],
                },
            }),
            // 3. Listings counts
            prisma_1.prisma.clothingListing.count(),
            prisma_1.prisma.clothingListing.count({ where: { status: client_1.ListingStatus.AVAILABLE } }),
            prisma_1.prisma.clothingListing.count({ where: { status: client_1.ListingStatus.RESERVED } }),
            prisma_1.prisma.clothingListing.count({ where: { status: client_1.ListingStatus.SWAPPED } }),
            // 4. Swap request status counts
            prisma_1.prisma.swapRequest.count(),
            prisma_1.prisma.swapRequest.count({ where: { status: client_1.SwapRequestStatus.PENDING } }),
            prisma_1.prisma.swapRequest.count({ where: { status: client_1.SwapRequestStatus.ACCEPTED } }),
            prisma_1.prisma.swapRequest.count({ where: { status: client_1.SwapRequestStatus.REJECTED } }),
            prisma_1.prisma.swapRequest.count({ where: { status: client_1.SwapRequestStatus.CANCELLED } }),
            prisma_1.prisma.swapRequest.count({ where: { status: client_1.SwapRequestStatus.COMPLETED } }),
            // 5. Total chat messages
            prisma_1.prisma.message.count(),
            // 6. Recent records for activity feed
            prisma_1.prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, email: true, createdAt: true },
            }),
            prisma_1.prisma.clothingListing.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, title: true, category: true, owner: { select: { name: true } }, createdAt: true },
            }),
            prisma_1.prisma.swapRequest.findMany({
                take: 5,
                orderBy: { updatedAt: 'desc' },
                select: {
                    id: true,
                    status: true,
                    requester: { select: { name: true } },
                    recipient: { select: { name: true } },
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ]);
        // Construct normalized recent activity feed from real database timestamps
        const activityItems = [
            ...recentUsers.map((u) => ({
                id: `user-${u.id}`,
                type: 'USER_REGISTERED',
                description: `New user registered: ${u.name} (${u.email})`,
                timestamp: u.createdAt,
                metadata: { userId: u.id, name: u.name, email: u.email },
            })),
            ...recentListings.map((l) => ({
                id: `listing-${l.id}`,
                type: 'LISTING_CREATED',
                description: `New listing posted: "${l.title}" by ${l.owner.name}`,
                timestamp: l.createdAt,
                metadata: { listingId: l.id, title: l.title, category: l.category },
            })),
            ...recentSwaps.map((s) => ({
                id: `swap-${s.id}`,
                type: s.status === 'PENDING' ? 'SWAP_REQUEST_CREATED' : 'SWAP_UPDATED',
                description: `Swap request between ${s.requester.name} and ${s.recipient.name} is ${s.status}`,
                timestamp: s.updatedAt,
                metadata: { swapId: s.id, status: s.status },
            })),
        ];
        // Sort descending by timestamp and take the top 10
        activityItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        const recentActivity = activityItems.slice(0, 10);
        return {
            users: {
                total: totalUsers,
                active: activeUsers,
            },
            listings: {
                total: totalListings,
                available: availableListings,
                reserved: reservedListings,
                swapped: swappedListings,
            },
            swaps: {
                total: totalSwaps,
                pending: pendingSwaps,
                accepted: acceptedSwaps,
                rejected: rejectedSwaps,
                cancelled: cancelledSwaps,
                completed: completedSwaps,
            },
            messages: {
                total: totalMessages,
            },
            recentActivity,
        };
    }
    /**
     * 2. User Management: List users with pagination, search, and role filter
     */
    static async getUsers(params) {
        const page = Math.max(1, params.page || 1);
        const limit = Math.min(100, Math.max(1, params.limit || 20));
        const skip = (page - 1) * limit;
        const where = {};
        if (params.role && params.role !== 'ALL') {
            where.role = params.role;
        }
        if (params.search && params.search.trim()) {
            const q = params.search.trim();
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
                { state: { contains: q, mode: 'insensitive' } },
            ];
        }
        const [users, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    ...exports.SAFE_ADMIN_USER_SELECT,
                    _count: {
                        select: {
                            listings: true,
                            sentSwapRequests: true,
                            receivedSwapRequests: true,
                            messages: true,
                        },
                    },
                },
            }),
            prisma_1.prisma.user.count({ where }),
        ]);
        return {
            users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * 3. User Details by ID
     */
    static async getUserById(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                ...exports.SAFE_ADMIN_USER_SELECT,
                _count: {
                    select: {
                        listings: true,
                        sentSwapRequests: true,
                        receivedSwapRequests: true,
                        messages: true,
                    },
                },
                listings: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        status: true,
                        estimatedSwapValue: true,
                        createdAt: true,
                        images: {
                            take: 1,
                            select: { imageUrl: true },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new auth_service_1.AppError('User not found.', 404);
        }
        return user;
    }
    /**
     * 4. User Role Management (USER <-> ADMIN)
     * With protection against self-demotion
     */
    static async updateUserRole(adminUserId, targetUserId, newRole) {
        const targetUser = await prisma_1.prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, email: true, role: true },
        });
        if (!targetUser) {
            throw new auth_service_1.AppError('Target user not found.', 404);
        }
        if (adminUserId === targetUserId && newRole !== client_1.Role.ADMIN) {
            throw new auth_service_1.AppError('Cannot demote your own administrator account.', 400);
        }
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: targetUserId },
            data: { role: newRole },
            select: exports.SAFE_ADMIN_USER_SELECT,
        });
        return updatedUser;
    }
    /**
     * 5. Clothing Listing Management: List all listings with filters
     */
    static async getListings(params) {
        const page = Math.max(1, params.page || 1);
        const limit = Math.min(100, Math.max(1, params.limit || 20));
        const skip = (page - 1) * limit;
        const where = {};
        if (params.status && params.status !== 'ALL') {
            where.status = params.status;
        }
        if (params.category) {
            where.category = params.category;
        }
        if (params.condition) {
            where.condition = params.condition;
        }
        if (params.search && params.search.trim()) {
            const q = params.search.trim();
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { brand: { contains: q, mode: 'insensitive' } },
                { color: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { owner: { name: { contains: q, mode: 'insensitive' } } },
            ];
        }
        const [listings, total] = await Promise.all([
            prisma_1.prisma.clothingListing.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    category: true,
                    brand: true,
                    color: true,
                    size: true,
                    condition: true,
                    estimatedSwapValue: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    owner: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            city: true,
                            state: true,
                        },
                    },
                    images: {
                        select: { id: true, imageUrl: true },
                        orderBy: { createdAt: 'asc' },
                    },
                    _count: {
                        select: {
                            offeredInSwaps: true,
                            requestedInSwaps: true,
                        },
                    },
                },
            }),
            prisma_1.prisma.clothingListing.count({ where }),
        ]);
        return {
            listings,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * 6. Get Listing Details for Admin Inspection
     */
    static async getListingById(id) {
        const listing = await prisma_1.prisma.clothingListing.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                description: true,
                category: true,
                brand: true,
                color: true,
                size: true,
                condition: true,
                estimatedSwapValue: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        city: true,
                        state: true,
                    },
                },
                images: {
                    select: { id: true, imageUrl: true },
                    orderBy: { createdAt: 'asc' },
                },
                _count: {
                    select: {
                        offeredInSwaps: true,
                        requestedInSwaps: true,
                    },
                },
            },
        });
        if (!listing) {
            throw new auth_service_1.AppError('Listing not found.', 404);
        }
        return listing;
    }
    /**
     * 7. Listing Moderation
     * Reversibly remove or restore a listing.
     * Marking a listing as RESERVED hides it from the public marketplace without destroying swap history.
     * Marking as AVAILABLE restores it to public visibility.
     */
    static async moderateListing(id, action) {
        const existing = await prisma_1.prisma.clothingListing.findUnique({
            where: { id },
            select: { id: true, title: true, status: true },
        });
        if (!existing) {
            throw new auth_service_1.AppError('Listing not found.', 404);
        }
        const nextStatus = action === 'REMOVE' ? client_1.ListingStatus.RESERVED : client_1.ListingStatus.AVAILABLE;
        const updated = await prisma_1.prisma.clothingListing.update({
            where: { id },
            data: { status: nextStatus },
            select: {
                id: true,
                title: true,
                status: true,
                updatedAt: true,
            },
        });
        return {
            listing: updated,
            message: action === 'REMOVE'
                ? 'Listing has been moderated and removed from the public marketplace.'
                : 'Listing has been restored to available status in the marketplace.',
        };
    }
    /**
     * 8. Swap Request Monitoring
     */
    static async getSwapRequests(params) {
        const page = Math.max(1, params.page || 1);
        const limit = Math.min(100, Math.max(1, params.limit || 20));
        const skip = (page - 1) * limit;
        const where = {};
        if (params.status && params.status !== 'ALL') {
            where.status = params.status;
        }
        if (params.search && params.search.trim()) {
            const q = params.search.trim();
            where.OR = [
                { requester: { name: { contains: q, mode: 'insensitive' } } },
                { requester: { email: { contains: q, mode: 'insensitive' } } },
                { recipient: { name: { contains: q, mode: 'insensitive' } } },
                { recipient: { email: { contains: q, mode: 'insensitive' } } },
                { offeredListing: { title: { contains: q, mode: 'insensitive' } } },
                { requestedListing: { title: { contains: q, mode: 'insensitive' } } },
            ];
        }
        const [swaps, total] = await Promise.all([
            prisma_1.prisma.swapRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                include: {
                    requester: { select: { id: true, name: true, email: true, city: true, state: true } },
                    recipient: { select: { id: true, name: true, email: true, city: true, state: true } },
                    offeredListing: {
                        select: {
                            id: true,
                            title: true,
                            category: true,
                            condition: true,
                            estimatedSwapValue: true,
                            status: true,
                            images: { take: 1, select: { imageUrl: true } },
                        },
                    },
                    requestedListing: {
                        select: {
                            id: true,
                            title: true,
                            category: true,
                            condition: true,
                            estimatedSwapValue: true,
                            status: true,
                            images: { take: 1, select: { imageUrl: true } },
                        },
                    },
                },
            }),
            prisma_1.prisma.swapRequest.count({ where }),
        ]);
        return {
            swaps,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * 9. Swap Request Details
     */
    static async getSwapRequestById(id) {
        const swap = await prisma_1.prisma.swapRequest.findUnique({
            where: { id },
            include: {
                requester: { select: { id: true, name: true, email: true, city: true, state: true } },
                recipient: { select: { id: true, name: true, email: true, city: true, state: true } },
                offeredListing: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        condition: true,
                        estimatedSwapValue: true,
                        status: true,
                        images: { select: { id: true, imageUrl: true } },
                    },
                },
                requestedListing: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        condition: true,
                        estimatedSwapValue: true,
                        status: true,
                        images: { select: { id: true, imageUrl: true } },
                    },
                },
                conversation: {
                    select: {
                        id: true,
                        createdAt: true,
                        updatedAt: true,
                        _count: { select: { messages: true } },
                    },
                },
            },
        });
        if (!swap) {
            throw new auth_service_1.AppError('Swap request not found.', 404);
        }
        return swap;
    }
    /**
     * 10. Conversation Metadata Monitoring (Privacy-Preserving)
     * Does NOT expose private chat messages in list views.
     */
    static async getConversations(params) {
        const page = Math.max(1, params.page || 1);
        const limit = Math.min(100, Math.max(1, params.limit || 20));
        const skip = (page - 1) * limit;
        const [conversations, total] = await Promise.all([
            prisma_1.prisma.conversation.findMany({
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                select: {
                    id: true,
                    swapRequestId: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: { select: { messages: true } },
                    swapRequest: {
                        select: {
                            id: true,
                            status: true,
                            requester: { select: { id: true, name: true, email: true } },
                            recipient: { select: { id: true, name: true, email: true } },
                            offeredListing: { select: { id: true, title: true } },
                            requestedListing: { select: { id: true, title: true } },
                        },
                    },
                },
            }),
            prisma_1.prisma.conversation.count(),
        ]);
        return {
            conversations,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * 11. Restricted Conversation Audit Details
     * For authorized admin audit only.
     */
    static async getConversationAudit(conversationId, page = 1, limit = 50) {
        const conversation = await prisma_1.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                swapRequest: {
                    include: {
                        requester: { select: { id: true, name: true, email: true } },
                        recipient: { select: { id: true, name: true, email: true } },
                        offeredListing: { select: { id: true, title: true } },
                        requestedListing: { select: { id: true, title: true } },
                    },
                },
            },
        });
        if (!conversation) {
            throw new auth_service_1.AppError('Conversation not found.', 404);
        }
        const skip = (page - 1) * limit;
        const [messages, total] = await Promise.all([
            prisma_1.prisma.message.findMany({
                where: { conversationId },
                skip,
                take: limit,
                orderBy: { createdAt: 'asc' },
                select: {
                    id: true,
                    senderId: true,
                    content: true,
                    readAt: true,
                    createdAt: true,
                    sender: { select: { id: true, name: true, email: true } },
                },
            }),
            prisma_1.prisma.message.count({ where: { conversationId } }),
        ]);
        return {
            conversation,
            messages,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
exports.AdminService = AdminService;
