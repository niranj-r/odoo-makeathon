import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole, requireRoles } from '../middleware/roles.js';
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus
} from '../controllers/productController.js';
import {
  listVariants,
  getVariantById,
  createVariant,
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

// GET /api/products - List products (Admin & Staff, cost_price redacted for Staff)
router.get('/', verifyAuth, requireRoles(['ADMIN', 'STAFF']), listProducts);

// POST /api/products - Create a new product (Admin only)
router.post('/', verifyAuth, requireRole('ADMIN'), createProduct);

// GET /api/products/:id - View product details (Admin & Staff, cost_price redacted for Staff)
router.get('/:id', verifyAuth, requireRoles(['ADMIN', 'STAFF']), getProductById);

// PUT /api/products/:id - Edit an existing product (Admin only)
router.put('/:id', verifyAuth, requireRole('ADMIN'), updateProduct);

// PATCH /api/products/:id/status - Soft archive / activate a product (Admin only)
router.patch('/:id/status', verifyAuth, requireRole('ADMIN'), updateProductStatus);

// ==============================================================================
// VARIANT ENDPOINTS (/api/products/:id/variants)
// ==============================================================================

// GET /api/products/variants/all - List all variants across all products (Admin & Staff)
router.get('/variants/all', verifyAuth, requireRoles(['ADMIN', 'STAFF']), listAllVariants);

// GET /api/products/:id/variants - List all variants for a product (Admin & Staff)
router.get('/:id/variants', verifyAuth, requireRoles(['ADMIN', 'STAFF']), listVariants);

// POST /api/products/:id/variants - Create a new variant for a product (Admin only)
router.post('/:id/variants', verifyAuth, requireRole('ADMIN'), createVariant);

// GET /api/products/:id/variants/:variantId - View single variant details (Admin & Staff)
router.get('/:id/variants/:variantId', verifyAuth, requireRoles(['ADMIN', 'STAFF']), getVariantById);

// PUT /api/products/:id/variants/:variantId - Edit variant (Admin only)
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

