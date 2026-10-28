import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Property from '../models/Property';
import Unit from '../models/Unit';
import Tenant from '../models/Tenant';
import WaitingList from '../models/WaitingList';
import Maintenance from '../models/Maintenance';
import Employee from '../models/Employee';
import GuardShift from '../models/GuardShift';
import Attendance from '../models/Attendance';
import Incident from '../models/Incident';
import PropertyStaff from '../models/PropertyStaff';
import Payment from '../models/Payment';
import { logger } from '../config/logger.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/enderase';

// Ethiopian property data based on real Addis Ababa market research
const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB for seeding...');

    // Clear existing data - drop collections to reset indexes
    const collections = ['users', 'properties', 'units', 'tenants', 'waitinglists', 'maintenances', 'employees', 'guardshifts', 'attendances', 'incidents', 'propertystaffs', 'payments'];
    for (const col of collections) {
      try { await mongoose.connection.db!.dropCollection(col); } catch (_) { /* collection may not exist */ }
    }
    logger.info('Cleared existing data');

    // Create sample owners
    const owners = await User.create([
      {
        email: 'owner@example.com',
        password: 'password123',
        name: 'Abebe Kebede',
        phone: '+251911234567',
        role: 'owner',
        isVerified: true,
      },
      {
        email: 'owner2@example.com',
        password: 'password123',
        name: 'Tigist Haile',
        phone: '+251922345678',
        role: 'owner',
        isVerified: true,
      },
      {
        email: 'owner3@example.com',
        password: 'password123',
        name: 'Dawit Mengistu',
        phone: '+251933456789',
        role: 'owner',
        isVerified: true,
      },
    ]);
    logger.info('Created sample owners');

    // Create sample tenants (users)
    const tenantUsers = await User.create([
      {
        email: 'tenant1@example.com',
        password: 'password123',
        name: 'Hana Tesfaye',
        phone: '+251944567890',
        role: 'tenant',
        isVerified: true,
      },
      {
        email: 'tenant2@example.com',
        password: 'password123',
        name: 'Yonas Girma',
        phone: '+251955678901',
        role: 'tenant',
        isVerified: true,
      },
      {
        email: 'tenant3@example.com',
        password: 'password123',
        name: 'Sara Alemayehu',
        phone: '+251966789012',
        role: 'tenant',
        isVerified: true,
      },
    ]);
    logger.info('Created sample tenant users');

    // Properties based on real Addis Ababa locations and prices
    const properties = await Property.create([
      // Bole - Premium expat area (90,000 - 370,000 ETB)
      {
        ownerId: owners[0]._id,
        name: 'Bole Luxury Apartments',
        type: 'apartment',
        description: 'Modern luxury apartment complex in the heart of Bole, close to Bole International Airport, shopping malls, and fine dining restaurants. Features 24/7 security, underground parking, swimming pool, and gym facilities.',
        address: {
          street: 'Bole Road, Near Edna Mall',
          city: 'Addis Ababa',
          state: 'Addis Ababa',
          country: 'Ethiopia',
          coordinates: { lat: 8.9806, lng: 38.7578 },
        },
        totalFloors: 12,
        totalUnits: 48,
        amenities: ['Swimming Pool', 'Gym', '24/7 Security', 'Underground Parking', 'Elevator', 'Generator Backup', 'Water Tank', 'Children Playground'],
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        ],
        isListed: true,
        listingStatus: 'available',
        waitingListType: 'both',
      },
      // Kazanchis - Business district (70,000 - 100,000 ETB)
      {
        ownerId: owners[0]._id,
        name: 'Kazanchis Business Suites',
        type: 'apartment',
        description: 'Premium apartments ideal for professionals working at international organizations, embassies, and major offices. Walking distance to African Union, UN ECA, and major hotels.',
        address: {
          street: 'Churchill Avenue, Kazanchis',
          city: 'Addis Ababa',
          state: 'Addis Ababa',
          country: 'Ethiopia',
          coordinates: { lat: 9.0167, lng: 38.7633 },
        },
        totalFloors: 8,
        totalUnits: 32,
        amenities: ['24/7 Security', 'Parking', 'Elevator', 'Generator Backup', 'High-Speed Internet', 'Conference Room'],
        images: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        ],
        isListed: true,
        listingStatus: 'available',
        waitingListType: 'application',
      },
      // CMC - Mid-range residential (40,000 - 80,000 ETB)
      {
        ownerId: owners[1]._id,
        name: 'CMC Michael Apartments',
        type: 'apartment',
        description: 'Comfortable family apartments in the peaceful CMC area. Close to schools, supermarkets, and public transportation. Ideal for families and young professionals.',
        address: {
          street: 'CMC Road, Near St. Michael Church',
          city: 'Addis Ababa',
          state: 'Addis Ababa',
          country: 'Ethiopia',
          coordinates: { lat: 9.0383, lng: 38.8317 },
        },
        totalFloors: 6,
        totalUnits: 24,
        amenities: ['Parking', 'Security Guard', 'Generator Backup', 'Water Tank', 'Laundry Area'],
        images: [
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
        ],
        isListed: true,
        listingStatus: 'available',
        waitingListType: 'queue',
      },
      // Sarbet - Premium residential (180,000 - 387,000 ETB)
      {
        ownerId: owners[1]._id,
        name: 'Sarbet Premium Residences',
        type: 'villa',
        description: 'Exclusive luxury villas and townhouses in Sarbet, one of Addis Ababa\'s most prestigious neighborhoods. Featuring modern architecture, private gardens, and premium finishes.',
        address: {
          street: 'Sarbet, Behind Saay Pastry',
          city: 'Addis Ababa',
          state: 'Addis Ababa',
          country: 'Ethiopia',
          coordinates: { lat: 9.0125, lng: 38.7467 },
        },
        totalFloors: 3,
        totalUnits: 8,
        amenities: ['Private Garden', 'Swimming Pool', '24/7 Security', 'Smart Home', 'CCTV', 'Underground Parking', 'Maid Quarter'],
        images: [
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
        ],
        isListed: true,
        listingStatus: 'available',
        waitingListType: 'application',
      },
      // Yeka/Summit - Affordable (28,000 - 60,000 ETB)
      {
        ownerId: owners[2]._id,
        name: 'Summit View Apartments',
        type: 'apartment',
        description: 'Affordable modern apartments in the growing Summit/Yeka area. Perfect for students, young professionals, and small families. Easy access to light rail and bus stations.',
        address: {
          street: 'Yeka Abado, Near Summit Condominium',
          city: 'Addis Ababa',
          state: 'Addis Ababa',
          country: 'Ethiopia',
          coordinates: { lat: 9.0467, lng: 38.8083 },
        },
        totalFloors: 5,
        totalUnits: 40,
        amenities: ['Security Guard', 'Parking', 'Water Tank', 'Satellite TV Connection'],
        images: [
          'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800',
          'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
        ],
        isListed: true,
        listingStatus: 'available',
        waitingListType: 'queue',
      },
      // Old Airport - Luxury (130,000 - 250,000 ETB)
      {
        ownerId: owners[2]._id,
        name: 'Old Airport Heights',
        type: 'apartment',
        description: 'Upscale apartments in the prestigious Old Airport area. Features stunning city views, high-end finishes, and proximity to embassies and international schools.',
        address: {
          street: 'Old Airport Road, Hayahulet',
          city: 'Addis Ababa',
          state: 'Addis Ababa',
          country: 'Ethiopia',
          coordinates: { lat: 9.0033, lng: 38.7633 },
        },
        totalFloors: 10,
        totalUnits: 30,
        amenities: ['Rooftop Terrace', 'Gym', '24/7 Security', 'Elevator', 'Underground Parking', 'Generator Backup', 'Concierge'],
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
        ],
        isListed: true,
        listingStatus: 'available',
        waitingListType: 'both',
      },
      // Commercial - Addis Ketema (Business)
      {
        ownerId: owners[0]._id,
        name: 'Merkato Business Center',
        type: 'commercial',
        description: 'Prime commercial spaces in the bustling Merkato area - Africa\'s largest open market. Ideal for retail shops, offices, and showrooms. High foot traffic guaranteed.',
        address: {
          street: 'Merkato, Addis Ketema',
          city: 'Addis Ababa',
          state: 'Addis Ababa',
          country: 'Ethiopia',
          coordinates: { lat: 9.0300, lng: 38.7400 },
        },
        totalFloors: 4,
        totalUnits: 20,
        amenities: ['Loading Dock', 'Security', 'Freight Elevator', 'Fire Safety System', 'Parking'],
        images: [
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
          'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        ],
        isListed: true,
        listingStatus: 'available',
        waitingListType: 'application',
      },
    ]);
    logger.info('Created sample properties');

    // Create units with realistic Ethiopian prices
    const units: any[] = [];

    // Bole Luxury Apartments - Units (90,000 - 180,000 ETB based on floor)
    for (let floor = 1; floor <= 12; floor++) {
      for (let unit = 1; unit <= 4; unit++) {
        const unitTypes = ['studio', '1bed', '2bed', '3bed'];
        const basePrices = [45000, 75000, 95000, 130000];
        const sizes = [35, 55, 85, 120];
        const typeIndex = (unit - 1) % 4;

        // Floor multiplier: higher floors cost more (up to 20% premium for penthouse)
        const floorMultiplier = 1 + (floor / 12) * 0.2;
        const totalPrice = Math.round(basePrices[typeIndex] * floorMultiplier);

        units.push({
          propertyId: properties[0]._id,
          unitNumber: `${floor}0${unit}`,
          floor,
          type: unitTypes[typeIndex],
          size: sizes[typeIndex],
          pricing: {
            basePrice: basePrices[typeIndex],
            floorMultiplier: parseFloat(floorMultiplier.toFixed(2)),
            amenityCharges: 5000,
            totalPrice: totalPrice + 5000,
          },
          status: floor <= 3 ? 'occupied' : (floor <= 6 ? 'reserved' : 'vacant'),
          features: ['Air Conditioning', 'Built-in Closets', 'Modern Kitchen', 'Balcony'],
          images: [],
        });
      }
    }

    // Kazanchis Business Suites - Units (70,000 - 100,000 ETB)
    for (let floor = 1; floor <= 8; floor++) {
      for (let unit = 1; unit <= 4; unit++) {
        const unitTypes = ['1bed', '2bed', '2bed', '3bed'];
        const basePrices = [55000, 70000, 75000, 90000];
        const sizes = [50, 75, 80, 110];
        const typeIndex = (unit - 1) % 4;

        const floorMultiplier = 1 + (floor / 8) * 0.15;
        const totalPrice = Math.round(basePrices[typeIndex] * floorMultiplier);

        units.push({
          propertyId: properties[1]._id,
          unitNumber: `K${floor}0${unit}`,
          floor,
          type: unitTypes[typeIndex],
          size: sizes[typeIndex],
          pricing: {
            basePrice: basePrices[typeIndex],
            floorMultiplier: parseFloat(floorMultiplier.toFixed(2)),
            amenityCharges: 3000,
            totalPrice: totalPrice + 3000,
          },
          status: floor <= 2 ? 'occupied' : 'vacant',
          features: ['High-Speed Internet', 'Air Conditioning', 'Modern Bathroom'],
          images: [],
        });
      }
    }

    // CMC Michael Apartments - Units (40,000 - 70,000 ETB)
    for (let floor = 1; floor <= 6; floor++) {
      for (let unit = 1; unit <= 4; unit++) {
        const unitTypes = ['studio', '1bed', '2bed', '2bed'];
        const basePrices = [28000, 40000, 55000, 60000];
        const sizes = [30, 45, 70, 75];
        const typeIndex = (unit - 1) % 4;

        const floorMultiplier = 1 + (floor / 6) * 0.1;
        const totalPrice = Math.round(basePrices[typeIndex] * floorMultiplier);

        units.push({
          propertyId: properties[2]._id,
          unitNumber: `C${floor}0${unit}`,
          floor,
          type: unitTypes[typeIndex],
          size: sizes[typeIndex],
          pricing: {
            basePrice: basePrices[typeIndex],
            floorMultiplier: parseFloat(floorMultiplier.toFixed(2)),
            amenityCharges: 2000,
            totalPrice: totalPrice + 2000,
          },
          status: floor <= 3 ? 'occupied' : 'vacant',
          features: ['Tile Flooring', 'Ceiling Fan', 'Storage Room'],
          images: [],
        });
      }
    }

    // Sarbet Premium Residences - Villas (180,000 - 350,000 ETB)
    const villaTypes = ['3bed', '3bed', '3bed', '3bed', '3bed', '3bed', '3bed', '3bed'];
    const villaPrices = [180000, 220000, 250000, 280000, 300000, 320000, 350000, 380000];
    const villaSizes = [180, 200, 220, 250, 280, 300, 320, 350];

    for (let i = 0; i < 8; i++) {
      units.push({
        propertyId: properties[3]._id,
        unitNumber: `V${i + 1}`,
        floor: 1,
        type: villaTypes[i],
        size: villaSizes[i],
        pricing: {
          basePrice: villaPrices[i],
          floorMultiplier: 1,
          amenityCharges: 15000,
          totalPrice: villaPrices[i] + 15000,
        },
        status: i < 3 ? 'occupied' : 'vacant',
        features: ['Private Garden', 'Maid Quarter', 'Modern Kitchen', 'Master Suite', 'Guest Bathroom', 'Garage'],
        images: [],
      });
    }

    // Summit View Apartments - Affordable (25,000 - 55,000 ETB)
    for (let floor = 1; floor <= 5; floor++) {
      for (let unit = 1; unit <= 8; unit++) {
        const unitTypes = ['studio', 'studio', '1bed', '1bed', '2bed', '2bed', '2bed', '2bed'];
        const basePrices = [20000, 22000, 30000, 32000, 42000, 45000, 48000, 50000];
        const sizes = [25, 28, 38, 40, 60, 65, 70, 72];
        const typeIndex = (unit - 1) % 8;

        const floorMultiplier = 1 + (floor / 5) * 0.08;
        const totalPrice = Math.round(basePrices[typeIndex] * floorMultiplier);

        units.push({
          propertyId: properties[4]._id,
          unitNumber: `S${floor}0${unit}`,
          floor,
          type: unitTypes[typeIndex],
          size: sizes[typeIndex],
          pricing: {
            basePrice: basePrices[typeIndex],
            floorMultiplier: parseFloat(floorMultiplier.toFixed(2)),
            amenityCharges: 1500,
            totalPrice: totalPrice + 1500,
          },
          status: floor <= 2 ? 'occupied' : 'vacant',
          features: ['Tile Flooring', 'Basic Kitchen'],
          images: [],
        });
      }
    }

    // Old Airport Heights - Luxury (130,000 - 220,000 ETB)
    for (let floor = 1; floor <= 10; floor++) {
      for (let unit = 1; unit <= 3; unit++) {
        const unitTypes = ['2bed', '3bed', '3bed'];
        const basePrices = [100000, 140000, 160000];
        const sizes = [100, 140, 160];
        const typeIndex = (unit - 1) % 3;

        const floorMultiplier = 1 + (floor / 10) * 0.25;
        const totalPrice = Math.round(basePrices[typeIndex] * floorMultiplier);

        units.push({
          propertyId: properties[5]._id,
          unitNumber: `OA${floor}0${unit}`,
          floor,
          type: unitTypes[typeIndex],
          size: sizes[typeIndex],
          pricing: {
            basePrice: basePrices[typeIndex],
            floorMultiplier: parseFloat(floorMultiplier.toFixed(2)),
            amenityCharges: 8000,
            totalPrice: totalPrice + 8000,
          },
          status: floor <= 4 ? 'occupied' : 'vacant',
          features: ['City View', 'Premium Finishes', 'Walk-in Closet', 'Jacuzzi'],
          images: [],
        });
      }
    }

    // Merkato Business Center - Commercial (15,000 - 50,000 ETB)
    for (let floor = 1; floor <= 4; floor++) {
      for (let unit = 1; unit <= 5; unit++) {
        const unitTypes = ['shop', 'shop', 'office', 'office', 'office'];
        const basePrices = [25000, 30000, 35000, 40000, 45000];
        const sizes = [25, 30, 40, 50, 60];
        const typeIndex = (unit - 1) % 5;

        const floorMultiplier = floor === 1 ? 1.3 : 1 - (floor - 1) * 0.1; // Ground floor premium for retail
        const totalPrice = Math.round(basePrices[typeIndex] * floorMultiplier);

        units.push({
          propertyId: properties[6]._id,
          unitNumber: `M${floor}0${unit}`,
          floor,
          type: unitTypes[typeIndex],
          size: sizes[typeIndex],
          pricing: {
            basePrice: basePrices[typeIndex],
            floorMultiplier: parseFloat(floorMultiplier.toFixed(2)),
            amenityCharges: 3000,
            totalPrice: totalPrice + 3000,
          },
          status: floor === 1 ? 'occupied' : 'vacant',
          features: floor === 1 ? ['Street Facing', 'Display Window', 'Storage'] : ['Office Space', 'Natural Light'],
          images: [],
        });
      }
    }

    const createdUnits = await Unit.create(units);
    logger.info(`Created ${createdUnits.length} sample units`);

    // Create some tenant records for occupied units
    const occupiedUnits = createdUnits.filter(u => u.status === 'occupied').slice(0, 3);

    const tenants = await Tenant.create([
      {
        userId: tenantUsers[0]._id,
        propertyId: properties[0]._id,
        unitId: occupiedUnits[0]._id,
        ownerId: owners[0]._id,
        leaseAgreement: {
          startDate: new Date('2024-06-01'),
          endDate: new Date('2025-06-01'),
          monthlyRent: occupiedUnits[0].pricing.totalPrice,
          deposit: occupiedUnits[0].pricing.totalPrice * 2,
          terms: 'Standard 1-year lease with 2-month deposit',
        },
        emergencyContact: {
          name: 'Mulugeta Tesfaye',
          phone: '+251911111111',
          relationship: 'Father',
        },
        status: 'active',
      },
      {
        userId: tenantUsers[1]._id,
        propertyId: properties[1]._id,
        unitId: occupiedUnits[1]._id,
        ownerId: owners[0]._id,
        leaseAgreement: {
          startDate: new Date('2024-03-15'),
          endDate: new Date('2025-03-15'),
          monthlyRent: occupiedUnits[1].pricing.totalPrice,
          deposit: occupiedUnits[1].pricing.totalPrice * 2,
          terms: 'Standard 1-year lease with 2-month deposit',
        },
        emergencyContact: {
          name: 'Almaz Girma',
          phone: '+251922222222',
          relationship: 'Mother',
        },
        status: 'active',
      },
      {
        userId: tenantUsers[2]._id,
        propertyId: properties[2]._id,
        unitId: occupiedUnits[2]._id,
        ownerId: owners[1]._id,
        leaseAgreement: {
          startDate: new Date('2024-09-01'),
          endDate: new Date('2025-09-01'),
          monthlyRent: occupiedUnits[2].pricing.totalPrice,
          deposit: occupiedUnits[2].pricing.totalPrice * 2,
          terms: 'Standard 1-year lease with 2-month deposit',
        },
        emergencyContact: {
          name: 'Berhanu Alemayehu',
          phone: '+251933333333',
          relationship: 'Brother',
        },
        status: 'active',
      },
    ]);
    logger.info('Created sample tenants');

    // Update units with tenant IDs
    for (let i = 0; i < 3; i++) {
      await Unit.findByIdAndUpdate(occupiedUnits[i]._id, {
        currentTenantId: tenants[i]._id,
        leaseStart: tenants[i].leaseAgreement.startDate,
        leaseEnd: tenants[i].leaseAgreement.endDate,
      });
    }

    // Create payment records for the last 6 months
    const paymentRecords: any[] = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
      let month = currentMonth - monthsAgo;
      let year = currentYear;
      if (month <= 0) { month += 12; year -= 1; }

      for (let i = 0; i < 3; i++) {
        const tenant = tenants[i];
        const unit = occupiedUnits[i];
        const property = properties[i <= 1 ? i : 2];
        const owner = i <= 1 ? owners[0] : owners[1];
        const isPaid = monthsAgo > 0; // current month still pending
        const dueDate = new Date(year, month - 1, 1);

        paymentRecords.push({
          tenantId: tenant._id,
          unitId: unit._id,
          propertyId: property._id,
          ownerId: owner._id,
          amount: unit.pricing.totalPrice,
          type: 'rent',
          status: isPaid ? 'completed' : 'pending',
          paymentMethod: isPaid ? 'chapa' : 'chapa',
          gatewayReference: isPaid ? `chapa-ref-${month}-${year}-${i}` : undefined,
          gatewayTransactionRef: isPaid ? `ENDER-tx-${month}-${year}-${i}` : undefined,
          dueDate,
          paidAt: isPaid ? new Date(year, month - 1, Math.floor(Math.random() * 5) + 1) : undefined,
          month,
          year,
          receipt: isPaid ? {
            number: `RCT-${year}${String(month).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
            generatedAt: new Date(year, month - 1, 5),
          } : undefined,
        });
      }
    }

    await Payment.create(paymentRecords);
    logger.info(`Created ${paymentRecords.length} payment records`);

    // Create some waiting list entries
    const waitingListApplicants = await User.create([
      {
        email: 'applicant1@example.com',
        password: 'password123',
        name: 'Meron Bekele',
        phone: '+251977890123',
        role: 'tenant',
        isVerified: true,
      },
      {
        email: 'applicant2@example.com',
        password: 'password123',
        name: 'Solomon Tadesse',
        phone: '+251988901234',
        role: 'tenant',
        isVerified: true,
      },
    ]);

    await WaitingList.create([
      {
        propertyId: properties[0]._id,
        applicantId: waitingListApplicants[0]._id,
        type: 'application',
        application: {
          employmentInfo: 'Software Engineer at Safaricom Ethiopia',
          income: 85000,
          references: ['Previous landlord: Mr. Getachew - +251911222333'],
          documents: [],
        },
        status: 'waiting',
        appliedAt: new Date(),
      },
      {
        propertyId: properties[4]._id,
        applicantId: waitingListApplicants[1]._id,
        type: 'queue',
        position: 1,
        status: 'waiting',
        appliedAt: new Date(),
      },
    ]);
    logger.info('Created waiting list entries');

    // Create some maintenance requests
    await Maintenance.create([
      {
        propertyId: properties[0]._id,
        unitId: occupiedUnits[0]._id,
        tenantId: tenants[0]._id,
        ownerId: owners[0]._id,
        title: 'Water heater not working',
        description: 'The water heater in the bathroom stopped working yesterday. No hot water available.',
        category: 'plumbing',
        priority: 'high',
        status: 'submitted',
        images: [],
        timeline: [
          { status: 'submitted', timestamp: new Date(), note: 'Request submitted by tenant', updatedBy: tenants[0].userId },
        ],
      },
      {
        propertyId: properties[1]._id,
        unitId: occupiedUnits[1]._id,
        tenantId: tenants[1]._id,
        ownerId: owners[0]._id,
        title: 'Air conditioner making noise',
        description: 'The AC unit is making a loud rattling noise when running. Still cooling but very noisy.',
        category: 'appliance',
        priority: 'medium',
        status: 'acknowledged',
        images: [],
        timeline: [
          { status: 'submitted', timestamp: new Date(Date.now() - 86400000), note: 'Request submitted by tenant', updatedBy: tenants[1].userId },
          { status: 'acknowledged', timestamp: new Date(), note: 'Acknowledged by property owner', updatedBy: owners[0]._id },
        ],
      },
      {
        propertyId: properties[2]._id,
        unitId: occupiedUnits[2]._id,
        tenantId: tenants[2]._id,
        ownerId: owners[1]._id,
        title: 'Kitchen sink drain clogged',
        description: 'The kitchen sink is draining very slowly. Tried using a plunger but it did not help.',
        category: 'plumbing',
        priority: 'low',
        status: 'completed',
        images: [],
        timeline: [
          { status: 'submitted', timestamp: new Date(Date.now() - 172800000), note: 'Request submitted by tenant', updatedBy: tenants[2].userId },
          { status: 'acknowledged', timestamp: new Date(Date.now() - 86400000), note: 'Acknowledged by property owner', updatedBy: owners[1]._id },
          { status: 'completed', timestamp: new Date(), note: 'Fixed by plumber - drain cleared', updatedBy: owners[1]._id },
        ],
        completedAt: new Date(),
        actualCost: 500,
        tenantRating: 5,
        tenantFeedback: 'Quick response and professional service!',
      },
    ]);
    logger.info('Created maintenance requests');

    // ==================== STAFF / EMPLOYEE / GUARD SEED DATA ====================

    // Create staff users (guards, cleaners, manager, technician)
    const staffUsers = await User.create([
      {
        email: 'guard1@example.com',
        password: 'password123',
        name: 'Tadesse Worku',
        phone: '+251911100001',
        role: 'guard',
        isVerified: true,
      },
      {
        email: 'guard2@example.com',
        password: 'password123',
        name: 'Bekele Hailu',
        phone: '+251911100002',
        role: 'guard',
        isVerified: true,
      },
      {
        email: 'guard3@example.com',
        password: 'password123',
        name: 'Alemu Desta',
        phone: '+251911100003',
        role: 'guard',
        isVerified: true,
      },
      {
        email: 'guard4@example.com',
        password: 'password123',
        name: 'Fikru Teshome',
        phone: '+251911100004',
        role: 'guard',
        isVerified: true,
      },
      {
        email: 'cleaner1@example.com',
        password: 'password123',
        name: 'Almaz Berhane',
        phone: '+251911100005',
        role: 'cleaner',
        isVerified: true,
      },
      {
        email: 'cleaner2@example.com',
        password: 'password123',
        name: 'Fatuma Ahmed',
        phone: '+251911100006',
        role: 'cleaner',
        isVerified: true,
      },
      {
        email: 'manager1@example.com',
        password: 'password123',
        name: 'Girma Tadesse',
        phone: '+251911100007',
        role: 'manager',
        isVerified: true,
      },
      {
        email: 'tech1@example.com',
        password: 'password123',
        name: 'Kebede Assefa',
        phone: '+251911100008',
        role: 'technician',
        isVerified: true,
      },
    ]);
    logger.info('Created staff users');

    // Assign staff to properties via PropertyStaff
    const staffAssignments = await PropertyStaff.create([
      // Bole Luxury Apartments - 2 guards, 1 cleaner, 1 manager
      { propertyId: properties[0]._id, userId: staffUsers[0]._id, role: 'guard', assignedBy: owners[0]._id, isActive: true },
      { propertyId: properties[0]._id, userId: staffUsers[1]._id, role: 'guard', assignedBy: owners[0]._id, isActive: true },
      { propertyId: properties[0]._id, userId: staffUsers[4]._id, role: 'cleaner', assignedBy: owners[0]._id, isActive: true },
      { propertyId: properties[0]._id, userId: staffUsers[6]._id, role: 'manager', assignedBy: owners[0]._id, isActive: true },
      // Kazanchis Business Suites - 1 guard, 1 technician
      { propertyId: properties[1]._id, userId: staffUsers[2]._id, role: 'guard', assignedBy: owners[0]._id, isActive: true },
      { propertyId: properties[1]._id, userId: staffUsers[7]._id, role: 'technician', assignedBy: owners[0]._id, isActive: true },
      // CMC Michael Apartments - 1 guard, 1 cleaner
      { propertyId: properties[2]._id, userId: staffUsers[3]._id, role: 'guard', assignedBy: owners[1]._id, isActive: true },
      { propertyId: properties[2]._id, userId: staffUsers[5]._id, role: 'cleaner', assignedBy: owners[1]._id, isActive: true },
    ]);
    logger.info('Created property staff assignments');

    // Create Employee records
    const employees = await Employee.create([
      {
        userId: staffUsers[0]._id,
        personalInfo: {
          dateOfBirth: new Date('1990-03-15'),
          gender: 'male',
          nationalId: 'ETH-ID-001234',
          address: 'Bole Sub-city, Woreda 03',
          city: 'Addis Ababa',
          emergencyContact: { name: 'Worknesh Tadesse', phone: '+251911200001', relationship: 'Wife' },
        },
        employment: {
          position: 'Senior Security Guard',
          department: 'security',
          employmentType: 'full_time',
          startDate: new Date('2023-01-15'),
          status: 'active',
        },
        salary: {
          baseSalary: 8000,
          currency: 'ETB',
          paymentFrequency: 'monthly',
          bankName: 'CBE',
          bankAccountNumber: '1000123456789',
        },
      },
      {
        userId: staffUsers[1]._id,
        personalInfo: {
          dateOfBirth: new Date('1988-07-22'),
          gender: 'male',
          nationalId: 'ETH-ID-001235',
          address: 'Kirkos Sub-city, Woreda 05',
          city: 'Addis Ababa',
          emergencyContact: { name: 'Meseret Bekele', phone: '+251911200002', relationship: 'Sister' },
        },
        employment: {
          position: 'Security Guard',
          department: 'security',
          employmentType: 'full_time',
          startDate: new Date('2023-06-01'),
          status: 'active',
        },
        salary: {
          baseSalary: 7000,
          currency: 'ETB',
          paymentFrequency: 'monthly',
          bankName: 'Dashen Bank',
          bankAccountNumber: '2000987654321',
        },
      },
      {
        userId: staffUsers[2]._id,
        personalInfo: {
          dateOfBirth: new Date('1992-11-08'),
          gender: 'male',
          nationalId: 'ETH-ID-001236',
          address: 'Arada Sub-city, Woreda 07',
          city: 'Addis Ababa',
          emergencyContact: { name: 'Hiwot Alemu', phone: '+251911200003', relationship: 'Mother' },
        },
        employment: {
          position: 'Security Guard',
          department: 'security',
          employmentType: 'full_time',
          startDate: new Date('2024-01-10'),
          status: 'active',
        },
        salary: {
          baseSalary: 7000,
          currency: 'ETB',
          paymentFrequency: 'monthly',
          bankName: 'Awash Bank',
          bankAccountNumber: '3000111222333',
        },
      },
      {
        userId: staffUsers[3]._id,
        personalInfo: {
          dateOfBirth: new Date('1995-05-30'),
          gender: 'male',
          nationalId: 'ETH-ID-001237',
          address: 'Yeka Sub-city, Woreda 12',
          city: 'Addis Ababa',
          emergencyContact: { name: 'Tigist Fikru', phone: '+251911200004', relationship: 'Wife' },
        },
        employment: {
          position: 'Night Security Guard',
          department: 'security',
          employmentType: 'full_time',
          startDate: new Date('2024-03-01'),
          status: 'active',
        },
        salary: {
          baseSalary: 7500,
          currency: 'ETB',
          paymentFrequency: 'monthly',
          bankName: 'Bank of Abyssinia',
          bankAccountNumber: '4000444555666',
        },
      },
      {
        userId: staffUsers[4]._id,
        personalInfo: {
          dateOfBirth: new Date('1985-09-12'),
          gender: 'female',
          nationalId: 'ETH-ID-001238',
          address: 'Nifas Silk-Lafto, Woreda 02',
          city: 'Addis Ababa',
          emergencyContact: { name: 'Tesfaye Berhane', phone: '+251911200005', relationship: 'Husband' },
        },
        employment: {
          position: 'Head Cleaner',
          department: 'cleaning',
          employmentType: 'full_time',
          startDate: new Date('2022-08-01'),
          status: 'active',
        },
        salary: {
          baseSalary: 6000,
          currency: 'ETB',
          paymentFrequency: 'monthly',
          bankName: 'CBE',
          bankAccountNumber: '5000777888999',
        },
      },
      {
        userId: staffUsers[5]._id,
        personalInfo: {
          dateOfBirth: new Date('1993-01-25'),
          gender: 'female',
          nationalId: 'ETH-ID-001239',
          address: 'Kolfe Keranio, Woreda 04',
          city: 'Addis Ababa',
          emergencyContact: { name: 'Mohammed Ahmed', phone: '+251911200006', relationship: 'Brother' },
        },
        employment: {
          position: 'Cleaner',
          department: 'cleaning',
          employmentType: 'part_time',
          startDate: new Date('2024-02-15'),
          status: 'active',
        },
        salary: {
          baseSalary: 4000,
          currency: 'ETB',
          paymentFrequency: 'monthly',
          bankName: 'Dashen Bank',
          bankAccountNumber: '6000111333555',
        },
      },
      {
        userId: staffUsers[6]._id,
        personalInfo: {
          dateOfBirth: new Date('1982-04-18'),
          gender: 'male',
          nationalId: 'ETH-ID-001240',
          address: 'Bole Sub-city, Woreda 09',
          city: 'Addis Ababa',
          emergencyContact: { name: 'Mulu Girma', phone: '+251911200007', relationship: 'Wife' },
        },
        employment: {
          position: 'Property Manager',
          department: 'management',
          employmentType: 'full_time',
          startDate: new Date('2022-01-01'),
          status: 'active',
        },
        salary: {
          baseSalary: 18000,
          currency: 'ETB',
          paymentFrequency: 'monthly',
          bankName: 'CBE',
          bankAccountNumber: '7000222444666',
        },
      },
      {
        userId: staffUsers[7]._id,
        personalInfo: {
          dateOfBirth: new Date('1991-08-05'),
          gender: 'male',
          nationalId: 'ETH-ID-001241',
          address: 'Lideta Sub-city, Woreda 01',
          city: 'Addis Ababa',
          emergencyContact: { name: 'Aster Kebede', phone: '+251911200008', relationship: 'Mother' },
        },
        employment: {
          position: 'Maintenance Technician',
          department: 'maintenance',
          employmentType: 'full_time',
          startDate: new Date('2023-09-01'),
          status: 'active',
        },
        salary: {
          baseSalary: 10000,
          currency: 'ETB',
          paymentFrequency: 'monthly',
          bankName: 'Awash Bank',
          bankAccountNumber: '8000333555777',
        },
      },
    ]);
    logger.info(`Created ${employees.length} employee records`);

    // Create Guard Shifts
    const guardShifts = await GuardShift.create([
      // Bole Luxury - Guard 1: Morning shift, Main Gate, Mon-Fri
      {
        propertyId: properties[0]._id,
        guardId: staffUsers[0]._id,
        shiftType: 'morning',
        startTime: '06:00',
        endTime: '14:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        guardPost: 'main_gate',
        isActive: true,
        assignedBy: owners[0]._id,
        effectiveFrom: new Date('2024-01-15'),
        notes: 'Primary morning guard at main entrance',
      },
      // Bole Luxury - Guard 2: Afternoon shift, Main Gate, Mon-Fri
      {
        propertyId: properties[0]._id,
        guardId: staffUsers[1]._id,
        shiftType: 'afternoon',
        startTime: '14:00',
        endTime: '22:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        guardPost: 'main_gate',
        isActive: true,
        assignedBy: owners[0]._id,
        effectiveFrom: new Date('2024-06-01'),
        notes: 'Afternoon shift coverage',
      },
      // Bole Luxury - Guard 1: Night shift on weekends (Sat-Sun)
      {
        propertyId: properties[0]._id,
        guardId: staffUsers[0]._id,
        shiftType: 'night',
        startTime: '22:00',
        endTime: '06:00',
        daysOfWeek: [0, 6],
        guardPost: 'parking',
        isActive: true,
        assignedBy: owners[0]._id,
        effectiveFrom: new Date('2024-01-15'),
        notes: 'Weekend night patrol at parking area',
      },
      // Bole Luxury - Guard 2: Morning weekend patrol
      {
        propertyId: properties[0]._id,
        guardId: staffUsers[1]._id,
        shiftType: 'morning',
        startTime: '06:00',
        endTime: '14:00',
        daysOfWeek: [0, 6],
        guardPost: 'lobby',
        isActive: true,
        assignedBy: owners[0]._id,
        effectiveFrom: new Date('2024-06-01'),
        notes: 'Weekend morning lobby duty',
      },
      // Kazanchis - Guard 3: Morning shift, Main Gate, Mon-Sat
      {
        propertyId: properties[1]._id,
        guardId: staffUsers[2]._id,
        shiftType: 'morning',
        startTime: '07:00',
        endTime: '15:00',
        daysOfWeek: [1, 2, 3, 4, 5, 6],
        guardPost: 'main_gate',
        isActive: true,
        assignedBy: owners[0]._id,
        effectiveFrom: new Date('2024-01-10'),
        notes: 'Business hours gate security',
      },
      // Kazanchis - Guard 3: Night patrol
      {
        propertyId: properties[1]._id,
        guardId: staffUsers[2]._id,
        shiftType: 'night',
        startTime: '22:00',
        endTime: '07:00',
        daysOfWeek: [0],
        guardPost: 'patrol',
        isActive: true,
        assignedBy: owners[0]._id,
        effectiveFrom: new Date('2024-01-10'),
        notes: 'Sunday night building patrol',
      },
      // CMC - Guard 4: Morning shift, Mon-Sat
      {
        propertyId: properties[2]._id,
        guardId: staffUsers[3]._id,
        shiftType: 'morning',
        startTime: '06:00',
        endTime: '18:00',
        daysOfWeek: [1, 2, 3, 4, 5, 6],
        guardPost: 'main_gate',
        isActive: true,
        assignedBy: owners[1]._id,
        effectiveFrom: new Date('2024-03-01'),
        notes: 'Extended day shift - single guard property',
      },
      // CMC - Guard 4: Night on weekdays
      {
        propertyId: properties[2]._id,
        guardId: staffUsers[3]._id,
        shiftType: 'night',
        startTime: '18:00',
        endTime: '06:00',
        daysOfWeek: [0],
        guardPost: 'patrol',
        isActive: true,
        assignedBy: owners[1]._id,
        effectiveFrom: new Date('2024-03-01'),
        notes: 'Sunday night coverage',
      },
    ]);
    logger.info(`Created ${guardShifts.length} guard shifts`);

    // Create Attendance records (last 7 days for all guards)
    const today = new Date();
    const attendanceRecords: any[] = [];

    for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(0, 0, 0, 0);
      const dayOfWeek = date.getDay();

      // Guard 1 at Bole (Mon-Fri morning, Sat-Sun night)
      if ([1, 2, 3, 4, 5].includes(dayOfWeek)) {
        const checkIn = new Date(date); checkIn.setHours(5, 55, 0, 0);
        const checkOut = new Date(date); checkOut.setHours(14, 5, 0, 0);
        attendanceRecords.push({
          employeeId: staffUsers[0]._id,
          propertyId: properties[0]._id,
          date,
          checkIn,
          checkOut,
          status: daysAgo === 3 ? 'late' : 'present',
          shiftId: guardShifts[0]._id,
          hoursWorked: 8.17,
          overtime: 0.17,
          recordedBy: staffUsers[0]._id,
          notes: daysAgo === 3 ? 'Arrived 15 minutes late due to traffic' : undefined,
        });
      }

      // Guard 2 at Bole (Mon-Fri afternoon)
      if ([1, 2, 3, 4, 5].includes(dayOfWeek)) {
        const checkIn = new Date(date); checkIn.setHours(14, 0, 0, 0);
        const checkOut = daysAgo === 0 ? undefined : (() => { const d = new Date(date); d.setHours(22, 10, 0, 0); return d; })();
        attendanceRecords.push({
          employeeId: staffUsers[1]._id,
          propertyId: properties[0]._id,
          date,
          checkIn,
          checkOut,
          status: daysAgo === 5 ? 'absent' : 'present',
          shiftId: guardShifts[1]._id,
          hoursWorked: checkOut ? 8.17 : undefined,
          overtime: checkOut ? 0.17 : undefined,
          recordedBy: staffUsers[1]._id,
          notes: daysAgo === 5 ? 'Sick leave - flu' : undefined,
        });
      }

      // Guard 3 at Kazanchis (Mon-Sat morning)
      if ([1, 2, 3, 4, 5, 6].includes(dayOfWeek)) {
        const checkIn = new Date(date); checkIn.setHours(6, 50, 0, 0);
        const checkOut = daysAgo === 0 ? undefined : (() => { const d = new Date(date); d.setHours(15, 0, 0, 0); return d; })();
        attendanceRecords.push({
          employeeId: staffUsers[2]._id,
          propertyId: properties[1]._id,
          date,
          checkIn,
          checkOut,
          status: 'present',
          shiftId: guardShifts[4]._id,
          hoursWorked: checkOut ? 8.17 : undefined,
          recordedBy: staffUsers[2]._id,
        });
      }

      // Guard 4 at CMC (Mon-Sat)
      if ([1, 2, 3, 4, 5, 6].includes(dayOfWeek)) {
        const checkIn = new Date(date); checkIn.setHours(6, 0, 0, 0);
        const checkOut = daysAgo === 0 ? undefined : (() => { const d = new Date(date); d.setHours(18, 0, 0, 0); return d; })();
        attendanceRecords.push({
          employeeId: staffUsers[3]._id,
          propertyId: properties[2]._id,
          date,
          checkIn,
          checkOut,
          status: 'present',
          shiftId: guardShifts[6]._id,
          hoursWorked: checkOut ? 12 : undefined,
          overtime: checkOut ? 4 : undefined,
          recordedBy: staffUsers[3]._id,
        });
      }

      // Cleaner 1 at Bole (Mon-Fri)
      if ([1, 2, 3, 4, 5].includes(dayOfWeek)) {
        const checkIn = new Date(date); checkIn.setHours(8, 0, 0, 0);
        const checkOut = daysAgo === 0 ? undefined : (() => { const d = new Date(date); d.setHours(17, 0, 0, 0); return d; })();
        attendanceRecords.push({
          employeeId: staffUsers[4]._id,
          propertyId: properties[0]._id,
          date,
          checkIn,
          checkOut,
          status: daysAgo === 1 ? 'half_day' : 'present',
          hoursWorked: checkOut ? (daysAgo === 1 ? 4 : 9) : undefined,
          recordedBy: staffUsers[6]._id,
          notes: daysAgo === 1 ? 'Left early - personal emergency' : undefined,
        });
      }
    }

    await Attendance.create(attendanceRecords);
    logger.info(`Created ${attendanceRecords.length} attendance records`);

    // Create Incidents
    const incidents = await Incident.create([
      {
        propertyId: properties[0]._id,
        reportedBy: staffUsers[0]._id,
        incidentType: 'unauthorized_access',
        severity: 'medium',
        title: 'Unknown person attempted to enter parking garage',
        description: 'At approximately 11:30 PM, an unidentified male attempted to enter the underground parking garage using a duplicate key card. Security confronted the individual who fled on foot. CCTV footage has been preserved.',
        location: 'Underground Parking - Level B1 entrance',
        occurredAt: new Date(Date.now() - 2 * 86400000),
        status: 'investigating',
        witnesses: ['Parking attendant Mulugeta'],
        policeReportFiled: true,
        policeReportNumber: 'AA-2024-78432',
      },
      {
        propertyId: properties[0]._id,
        reportedBy: staffUsers[1]._id,
        incidentType: 'disturbance',
        severity: 'low',
        title: 'Noise complaint from unit 305',
        description: 'Tenant in unit 305 reported excessive noise from unit 306. Upon investigation, unit 306 was having a party. Residents were asked to reduce noise levels and complied.',
        location: 'Floor 3 - Units 305/306',
        occurredAt: new Date(Date.now() - 5 * 86400000),
        status: 'resolved',
        resolution: 'Spoke with residents in unit 306 who agreed to keep noise down after 10 PM. Written warning issued.',
        resolvedBy: staffUsers[6]._id,
        resolvedAt: new Date(Date.now() - 4 * 86400000),
      },
      {
        propertyId: properties[0]._id,
        reportedBy: staffUsers[0]._id,
        incidentType: 'suspicious_activity',
        severity: 'high',
        title: 'Suspicious vehicle parked near building for 3 days',
        description: 'A white Toyota Corolla with no plates has been parked near the west side of the building for 3 consecutive days. No one has been seen entering or leaving the vehicle. Vehicle appears abandoned.',
        location: 'West side street parking',
        occurredAt: new Date(Date.now() - 1 * 86400000),
        status: 'reported',
        policeReportFiled: false,
      },
      {
        propertyId: properties[1]._id,
        reportedBy: staffUsers[2]._id,
        incidentType: 'theft',
        severity: 'high',
        title: 'Bicycle stolen from lobby area',
        description: 'A tenant reported their bicycle was stolen from the lobby area. The bicycle was not locked. CCTV shows an individual taking the bicycle at 3:15 AM. Clear footage of the suspect has been obtained.',
        location: 'Ground floor lobby',
        occurredAt: new Date(Date.now() - 3 * 86400000),
        status: 'investigating',
        witnesses: ['Night watchman on adjacent building'],
        policeReportFiled: true,
        policeReportNumber: 'AA-2024-78501',
      },
      {
        propertyId: properties[1]._id,
        reportedBy: staffUsers[2]._id,
        incidentType: 'fire',
        severity: 'critical',
        title: 'Small electrical fire in utility room',
        description: 'A small fire broke out in the ground floor utility room due to an electrical short circuit. Fire was contained using extinguisher before fire department arrival. No injuries. Electrical system needs inspection.',
        location: 'Ground floor utility room',
        occurredAt: new Date(Date.now() - 10 * 86400000),
        status: 'resolved',
        resolution: 'Fire department inspected and cleared the area. Faulty wiring replaced by licensed electrician. All electrical panels on ground floor inspected and certified safe.',
        resolvedBy: owners[0]._id,
        resolvedAt: new Date(Date.now() - 8 * 86400000),
        policeReportFiled: true,
        policeReportNumber: 'AA-FD-2024-1234',
      },
      {
        propertyId: properties[2]._id,
        reportedBy: staffUsers[3]._id,
        incidentType: 'vandalism',
        severity: 'medium',
        title: 'Graffiti on external wall',
        description: 'Graffiti was sprayed on the eastern external wall of the building overnight. Spray paint covers approximately 2x3 meters. CCTV in that area was not functioning.',
        location: 'East external wall',
        occurredAt: new Date(Date.now() - 7 * 86400000),
        status: 'resolved',
        resolution: 'Wall repainted. CCTV camera repaired and repositioned for better coverage. Motion-sensor light installed.',
        resolvedBy: owners[1]._id,
        resolvedAt: new Date(Date.now() - 5 * 86400000),
      },
      {
        propertyId: properties[2]._id,
        reportedBy: staffUsers[3]._id,
        incidentType: 'medical',
        severity: 'high',
        title: 'Elderly tenant fell in corridor',
        description: 'Elderly tenant from unit C201 slipped and fell in the 2nd floor corridor. Tenant complained of hip pain. Ambulance was called. Tenant was transported to Tikur Anbessa Hospital.',
        location: '2nd floor corridor',
        occurredAt: new Date(Date.now() - 4 * 86400000),
        status: 'closed',
        resolution: 'Tenant treated and released. Non-slip strips installed in all corridors. Handrails added to both sides of hallways.',
        resolvedBy: owners[1]._id,
        resolvedAt: new Date(Date.now() - 3 * 86400000),
      },
    ]);
    logger.info(`Created ${incidents.length} incident records`);

    logger.info('\n========================================');
    logger.info('Database seeded successfully!');
    logger.info('========================================');
    logger.info('\nSample Login Credentials:');
    logger.info('----------------------------------------');
    logger.info('Owners:');
    logger.info('  - owner@example.com / password123 (Abebe Kebede)');
    logger.info('  - owner2@example.com / password123 (Tigist Haile)');
    logger.info('  - owner3@example.com / password123 (Dawit Mengistu)');
    logger.info('\nTenants:');
    logger.info('  - tenant1@example.com / password123 (Hana Tesfaye)');
    logger.info('  - tenant2@example.com / password123 (Yonas Girma)');
    logger.info('  - tenant3@example.com / password123 (Sara Alemayehu)');
    logger.info('\nStaff:');
    logger.info('  - guard1@example.com / password123 (Tadesse Worku - Guard)');
    logger.info('  - guard2@example.com / password123 (Bekele Hailu - Guard)');
    logger.info('  - guard3@example.com / password123 (Alemu Desta - Guard)');
    logger.info('  - guard4@example.com / password123 (Fikru Teshome - Guard)');
    logger.info('  - cleaner1@example.com / password123 (Almaz Berhane - Cleaner)');
    logger.info('  - cleaner2@example.com / password123 (Fatuma Ahmed - Cleaner)');
    logger.info('  - manager1@example.com / password123 (Girma Tadesse - Manager)');
    logger.info('  - tech1@example.com / password123 (Kebede Assefa - Technician)');
    logger.info('========================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Seeding error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedData();
