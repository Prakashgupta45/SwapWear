import { Router } from 'express';
import { ListingController } from '../controllers/listing.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createListingSchema, updateListingSchema } from '../validations/listing.validation';

const router = Router();

// Public routes
// GET /api/listings
router.get('/', ListingController.getListings);

// GET /api/listings/my — must be before /:id to avoid conflict
router.get('/my', authenticate, ListingController.getMyListings);

// GET /api/listings/:id
router.get('/:id', ListingController.getListingById);

// Protected routes
// POST /api/listings
router.post('/', authenticate, validate(createListingSchema), ListingController.createListing);

// PATCH /api/listings/:id
router.patch('/:id', authenticate, validate(updateListingSchema), ListingController.updateListing);

// DELETE /api/listings/:id
router.delete('/:id', authenticate, ListingController.deleteListing);

export default router;
