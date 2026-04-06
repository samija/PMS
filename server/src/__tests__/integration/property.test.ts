import request from 'supertest';
import express from 'express';
import { setupTestDB, createTestUser, createTestProperty } from './helpers';

setupTestDB();

describe('Property API', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    const propertyRoutes = (await import('../../routes/propertyRoutes.js')).default;
    app.use('/api/properties', propertyRoutes);
    // Error handler
    app.use((err: any, _req: any, res: any, _next: any) => {
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    });
  });

  describe('GET /api/properties', () => {
    it('should return properties for authenticated owner', async () => {
      const { user, token } = await createTestUser();
      await createTestProperty(user._id.toString());

      const res = await request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/properties');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/properties', () => {
    it('should create a property', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Property',
          type: 'apartment',
          address: {
            street: 'Meskel Square',
            city: 'Addis Ababa',
            state: 'Addis Ababa',
            country: 'Ethiopia',
          },
          totalFloors: 3,
          totalUnits: 12,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'New Property');
    });

    it('should reject invalid property data', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '', // Invalid: empty name
          type: 'invalid_type',
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/properties/:id', () => {
    it('should return a single property', async () => {
      const { user, token } = await createTestUser();
      const property = await createTestProperty(user._id.toString());

      const res = await request(app)
        .get(`/api/properties/${property._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('name', 'Test Property');
    });

    it('should return 404 for non-existent property', async () => {
      const { token } = await createTestUser();
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .get(`/api/properties/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
