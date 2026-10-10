import { Router } from 'express';
import * as auth from '../controllers/auth.controller';
import * as product from '../controllers/product.controller';
import * as category from '../controllers/category.controller';
import * as order from '../controllers/order.controller';
import * as manual from '../controllers/manualPayment.controller';
import * as purchase from '../controllers/purchase.controller';
import * as course from '../controllers/course.controller';
import * as coupon from '../controllers/coupon.controller';
import * as notif from '../controllers/notification.controller';
import * as settings from '../controllers/settings.controller';
import * as admin from '../controllers/admin.controller';
import * as guest from '../controllers/guest.controller';
import { authenticate, authorizeAdmin, optionalAuth, requireRole } from '../middleware/auth';
import { authLimiter, paymentLimiter } from '../middleware/security';
import { uploadSingle } from '../middleware/upload';
import { validate } from '../middleware/validate';
import * as v from '../validators';

export const api = Router();

// Auth
const a = Router();
a.post('/register', authLimiter, validate(v.registerSchema), auth.register);
a.post('/login', authLimiter, validate(v.loginSchema), auth.login);
a.post('/logout', auth.logout);
a.get('/me', authenticate, auth.me);
a.put('/profile', authenticate, validate(v.profileSchema), auth.updateProfile);
a.post('/forgot-password', authLimiter, validate(v.emailOnlySchema), auth.forgotPassword);
a.post('/reset-password', authLimiter, validate(v.resetPasswordSchema), auth.resetPassword);
a.put('/change-password', authenticate, authLimiter, validate(v.changePasswordSchema), auth.changePassword);
api.use('/auth', a);

// Products (public)
const p = Router();
p.get('/', product.listProducts);
p.get('/home', product.homeProducts);
p.get('/by-id/:id', product.getById);
p.get('/:id/download', authenticate, product.downloadFile);
p.get('/:slug', product.getBySlug);
api.use('/products', p);

// Categories
const c = Router();
c.get('/', category.listCategories);
c.post('/', authenticate, authorizeAdmin, validate(v.categorySchema), category.createCategory);
c.put('/:id', authenticate, authorizeAdmin, validate(v.categorySchema), category.updateCategory);
c.delete('/:id', authenticate, authorizeAdmin, category.deleteCategory);
api.use('/categories', c);

// Orders
const o = Router();
o.post('/checkout', optionalAuth, paymentLimiter, validate(v.checkoutSchema), order.checkout);
o.get('/mine', authenticate, order.myOrders);
// Guest access via the order's private token (no login needed)
// Manual payment (bKash / Nagad / Rocket), guarded by the order's private token
o.get('/pay/:orderNumber', paymentLimiter, manual.getPayInfo);
o.post('/pay/:orderNumber', paymentLimiter, validate(v.submitPaymentSchema), manual.submitPayment);
o.post('/recover', authLimiter, validate(v.emailOnlySchema), guest.recoverAccess);
o.get('/access/:orderNumber', paymentLimiter, guest.guestAccess);
o.get('/access/:orderNumber/file', paymentLimiter, guest.guestFile);
o.post('/access/:orderNumber/set-password', authLimiter, validate(v.setPasswordSchema), guest.setPassword);
api.use('/orders', o);

// Purchases / access
const pu = Router();
pu.use(authenticate);
pu.get('/mine', purchase.myPurchases);
pu.get('/summary', purchase.dashboardSummary);
pu.get('/check/:productId', purchase.checkOwned);
pu.get('/product/:productId', purchase.accessProduct);
api.use('/purchases', pu);
api.use('/users', Router().get('/summary', authenticate, purchase.dashboardSummary));

// Courses
const co = Router();
co.use(authenticate);
co.get('/:productId', course.getCourse);
co.post('/:productId/progress', validate(v.progressSchema), course.updateProgress);
api.use('/courses', co);

// Coupons
const cp = Router();
cp.post('/validate', authenticate, validate(v.couponValidateSchema), coupon.validateCoupon);
cp.get('/', authenticate, authorizeAdmin, coupon.listCoupons);
cp.post('/', authenticate, authorizeAdmin, validate(v.couponSchema), coupon.createCoupon);
cp.put('/:id', authenticate, authorizeAdmin, validate(v.couponSchema), coupon.updateCoupon);
cp.delete('/:id', authenticate, authorizeAdmin, coupon.deleteCoupon);
api.use('/coupons', cp);

// Notifications
const n = Router();
n.use(authenticate);
n.get('/', notif.listNotifications);
n.post('/read-all', notif.markAllRead);
n.patch('/:id/read', notif.markRead);
api.use('/notifications', n);

// Settings
api.get('/settings', settings.getSettings);
api.put('/settings', authenticate, authorizeAdmin, validate(v.settingsSchema), settings.updateSettings);

// Admin
const ad = Router();
ad.use(authenticate, authorizeAdmin);
ad.get('/stats', admin.adminStats);
ad.get('/products', admin.adminListProducts);
ad.get('/products/:id', admin.adminGetProduct);
ad.post('/products', validate(v.productSchema), admin.adminCreateProduct);
ad.put('/products/:id', validate(v.productSchema), admin.adminUpdateProduct);
ad.delete('/products/:id', admin.adminDeleteProduct);
ad.get('/orders', admin.adminListOrders);
ad.get('/orders/:id', admin.adminGetOrder);
ad.post('/orders/:id/approve', validate(v.approveSchema), admin.adminApprove);
ad.post('/orders/:id/reject', validate(v.rejectSchema), admin.adminReject);
ad.get('/purchases', admin.adminListPurchases);
ad.post('/purchases/:id/revoke', validate(v.revokeSchema), admin.adminRevoke);
ad.post('/purchases/:id/restore', admin.adminRestore);
ad.get('/users', admin.adminListUsers);
ad.get('/users/:id', admin.adminGetUser);
ad.put('/users/:id', validate(v.adminUserSchema), admin.adminUpdateUser);
ad.get('/payments', admin.adminListPayments);
ad.get('/audit-logs', admin.adminAuditLogs);
ad.post('/upload', uploadSingle, admin.uploadFile);
ad.delete('/upload', admin.deleteUpload);
api.use('/admin', ad);
