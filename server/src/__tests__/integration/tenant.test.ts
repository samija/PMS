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

describe('Tenant API', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    const tenantRoutes = (await import('../../routes/tenantRoutes.js')).default;
    app.use('/api/tenants', tenantRoutes);
    app.use((err: any, _req: any, res: any, _next: any) => {
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    });
  });

  describe('GET /api/tenants', () => {
    it('should return tenants for an owner', async () => {
      const { user: owner, token } = await createTestUser({ role: 'owner' });
      const { user: tenantUser } = await createTestUser({ role: 'tenant', email: 'tenant1@test.com' });
      const property = await createTestProperty(owner._id.toString());
      const unit = await createTestUnit(property._id.toString());
      await createTestTenant(
        tenantUser._id.toString(),
        property._id.toString(),
        unit._id.toString(),
        owner._id.toString()
      );

      const res = await request(app)
        .get('/api/tenants')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/tenants');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/tenants', () => {
    it('should create a tenant with valid data', async () => {
      const { user: owner, token } = await createTestUser({ role: 'owner' });
      const property = await createTestProperty(owner._id.toString());
      const unit = await createTestUnit(property._id.toString());

      const res = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'newtenant@example.com',
          name: 'New Tenant',
          phone: '+251912000000',
          propertyId: property._id.toString(),
          unitId: unit._id.toString(),
          leaseAgreement: {
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            monthlyRent: 15000,
            deposit: 30000,
          },
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });
});
