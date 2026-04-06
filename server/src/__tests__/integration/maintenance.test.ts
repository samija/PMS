import request from 'supertest';
import express from 'express';
import {
  setupTestDB,
  createTestUser,
  createTestProperty,
  createTestUnit,
  createTestTenant,
} from './helpers.js';
import maintenanceRoutes from '../../routes/maintenanceRoutes.js';

setupTestDB();

describe('Maintenance API', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/maintenance', maintenanceRoutes);
    app.use((err: any, _req: any, res: any, _next: any) => {
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    });
  });

  describe('GET /api/maintenance', () => {
    it('should return maintenance requests for owner', async () => {
      const { token } = await createTestUser({ role: 'owner' });

      const res = await request(app)
        .get('/api/maintenance')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/maintenance');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/maintenance', () => {
    it('should create a maintenance request', async () => {
      const { user: owner, token: ownerToken } = await createTestUser({ role: 'owner' });
      const { user: tenantUser, token: tenantToken } = await createTestUser({
        role: 'tenant',
        email: 'maint-tenant@test.com',
      });
      const property = await createTestProperty(owner._id.toString());
      const unit = await createTestUnit(property._id.toString());
      await createTestTenant(
        tenantUser._id.toString(),
        property._id.toString(),
        unit._id.toString(),
        owner._id.toString()
      );

      const res = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          propertyId: property._id.toString(),
          unitId: unit._id.toString(),
          title: 'Broken Pipe',
          description: 'Water leaking from kitchen pipe',
          category: 'plumbing',
          priority: 'high',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });
});
