import 'reflect-metadata';
import { PdfLibLeaseRenderer } from '../../infrastructure/pdf/PdfLibLeaseRenderer.js';
import { Types } from 'mongoose';

const renderer = new PdfLibLeaseRenderer();

const TEMPLATE: any = {
  _id: new Types.ObjectId(),
  name: 'Ethiopian Standard Rental Agreement',
  sections: [
    {
      title: 'Parties',
      body: 'This agreement is between {{ownerName}} ("Landlord") and {{tenantName}} ("Tenant").',
      order: 1,
    },
    { title: 'Property', body: 'The property located at {{propertyAddress}}, Unit {{unitNumber}}.', order: 2 },
    { title: 'Term', body: 'The lease begins on {{startDate}} and ends on {{endDate}}.', order: 3 },
    { title: 'Rent', body: 'Monthly rent: {{monthlyRent}} {{currency}}, due on the 1st of each month.', order: 4 },
    { title: 'Deposit', body: 'Security deposit of {{deposit}} {{currency}} is due at signing.', order: 5 },
  ],
  placeholders: [
    'ownerName',
    'tenantName',
    'propertyAddress',
    'unitNumber',
    'startDate',
    'endDate',
    'monthlyRent',
    'currency',
    'deposit',
  ],
};

const PLACEHOLDERS = {
  ownerName: 'Meseret Tadesse',
  tenantName: 'Daniel Hailu',
  propertyAddress: 'Bole Road, Addis Ababa',
  unitNumber: 'A-101',
  startDate: '2026-01-01',
  endDate: '2027-01-01',
  monthlyRent: '15000',
  currency: 'ETB',
  deposit: '30000',
};

describe('PdfLibLeaseRenderer', () => {
  it('produces a valid PDF buffer with non-zero length', async () => {
    const result = await renderer.render({ template: TEMPLATE, placeholders: PLACEHOLDERS });
    expect(result.pdf).toBeInstanceOf(Buffer);
    expect(result.pdf.length).toBeGreaterThan(100);
    expect(result.sha256).toHaveLength(64);
  });

  it('PBT: same input produces same SHA-256 (idempotent)', async () => {
    const r1 = await renderer.render({ template: TEMPLATE, placeholders: PLACEHOLDERS });
    const r2 = await renderer.render({ template: TEMPLATE, placeholders: PLACEHOLDERS });
    expect(r1.sha256).toBe(r2.sha256);
    expect(r1.pdf.length).toBe(r2.pdf.length);
  });

  it('different placeholders produce different SHA-256', async () => {
    const r1 = await renderer.render({ template: TEMPLATE, placeholders: PLACEHOLDERS });
    const r2 = await renderer.render({
      template: TEMPLATE,
      placeholders: { ...PLACEHOLDERS, tenantName: 'Abel Kebede' },
    });
    expect(r1.sha256).not.toBe(r2.sha256);
  });

  it('PDF starts with %PDF magic bytes', async () => {
    const result = await renderer.render({ template: TEMPLATE, placeholders: PLACEHOLDERS });
    const header = result.pdf.slice(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');
  });
});
