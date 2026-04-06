import request from 'supertest';
import express from 'express';
import {
  setupTestDB,
  createTestUser,
  createTestProperty,
  createTestUnit,
  createTestTenant,
} from './helpers';

setupTestDB();

describe('Payment API', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    const paymentRoutes = (await import('../../routes/paymentRoutes.js')).default;
    app.use('/api/payments', paymentRoutes);
    app.use((err: any, _req: any, res: any, _next: any) => {
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    });
  });

  describe('GET /api/payments', () => {
    it('should return payments for authenticated user', async () => {
      const { token } = await createTestUser({ role: 'owner' });

      const res = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/payments');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/payments/manual', () => {
    it('should create a manual payment', async () => {
      const { user: owner, token } = await createTestUser({ role: 'owner' });
      const { user: tenantUser } = await createTestUser({ role: 'tenant', email: 'paytenant@test.com' });
      const property = await createTestProperty(owner._id.toString());
      const unit = await createTestUnit(property._id.toString());
      const tenant = await createTestTenant(
        tenantUser._id.toString(),
        property._id.toString(),
        unit._id.toString(),
        owner._id.toString()
      );

      const res = await request(app)
        .post('/api/payments/manual')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tenantId: tenant._id.toString(),
          amount: 15000,
          type: 'rent',
          paymentMethod: 'bank_transfer',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });
});
