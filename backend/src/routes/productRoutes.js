import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole, requireRoles } from '../middleware/roles.js';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  updateProductStatus
} from '../controllers/productController.js';
import {
  createVariant,
  getVariantsByProductId,
  getVariantById,
  updateVariant,
  updateVariantStatus,
  listAllVariants
} from '../controllers/variantController.js';
import {
  getProductTaxes,
  assignProductTaxes
} from '../controllers/taxController.js';

const router = Router();

// ==============================================================================
// PRODUCT ENDPOINTS (/api/products)
// ==============================================================================

// GET /api/products/all-variants - List all product variants across all products
router.get('/all-variants', verifyAuth, listAllVariants);

// POST /api/products - Create a new product (Admin only)
router.post('/', verifyAuth, requireRole('ADMIN'), createProduct);

// GET /api/products - List products with optional search and filters
router.get('/', verifyAuth, getProducts);

// GET /api/products/:id - Retrieve a specific product by UUID
router.get('/:id', verifyAuth, getProductById);

// PUT /api/products/:id - Update product details (Admin only)
router.put('/:id', verifyAuth, requireRole('ADMIN'), updateProduct);

// PATCH /api/products/:id/status - Activate / deactivate product (Admin only)
router.patch('/:id/status', verifyAuth, requireRole('ADMIN'), updateProductStatus);

// ==============================================================================
// VARIANT ENDPOINTS (/api/products/:id/variants)
// ==============================================================================

// POST /api/products/:id/variants - Add a variant to a product (Admin only)
router.post('/:id/variants', verifyAuth, requireRole('ADMIN'), createVariant);

// GET /api/products/:id/variants - List variants for a product
router.get('/:id/variants', verifyAuth, getVariantsByProductId);

// GET /api/products/:id/variants/:variantId - Get variant details
router.get('/:id/variants/:variantId', verifyAuth, getVariantById);

// PUT /api/products/:id/variants/:variantId - Update a variant (Admin only)
router.put('/:id/variants/:variantId', verifyAuth, requireRole('ADMIN'), updateVariant);

// PATCH /api/products/:id/variants/:variantId/status - Activate / deactivate variant (Admin only)
router.patch('/:id/variants/:variantId/status', verifyAuth, requireRole('ADMIN'), updateVariantStatus);

// ==============================================================================
// PRODUCT TAX ENDPOINTS (/api/products/:productId/taxes)
// ==============================================================================

// GET /api/products/:productId/taxes - View taxes associated with a product (Admin & Staff)
router.get('/:productId/taxes', verifyAuth, requireRoles(['ADMIN', 'STAFF']), getProductTaxes);

// PUT /api/products/:productId/taxes - Assign / update taxes for a product (Admin only)
router.put('/:productId/taxes', verifyAuth, requireRole('ADMIN'), assignProductTaxes);

export default router;
