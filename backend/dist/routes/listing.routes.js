"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const listing_controller_1 = require("../controllers/listing.controller");
const match_controller_1 = require("../controllers/match.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const listing_validation_1 = require("../validations/listing.validation");
const router = (0, express_1.Router)();
// Public routes
// GET /api/listings
router.get('/', listing_controller_1.ListingController.getListings);
// GET /api/listings/my — must be before /:id to avoid conflict
router.get('/my', auth_middleware_1.authenticate, listing_controller_1.ListingController.getMyListings);
// GET /api/listings/:id/matches — Phase 6: Top swap matches for this listing
router.get('/:id/matches', match_controller_1.MatchController.getListingMatches);
// GET /api/listings/:id
router.get('/:id', listing_controller_1.ListingController.getListingById);
// Protected routes
// POST /api/listings
router.post('/', auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(listing_validation_1.createListingSchema), listing_controller_1.ListingController.createListing);
// PATCH /api/listings/:id
router.patch('/:id', auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(listing_validation_1.updateListingSchema), listing_controller_1.ListingController.updateListing);
// DELETE /api/listings/:id
router.delete('/:id', auth_middleware_1.authenticate, listing_controller_1.ListingController.deleteListing);
exports.default = router;
