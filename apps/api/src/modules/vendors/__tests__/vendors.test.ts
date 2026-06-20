import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  createVendor,
  getVendorById,
  getVendors,
  updateVendor,
  createVendorAgreement,
  getActiveVendorAgreement,
  recordVendorPerformance,
  getVendorPerformance,
  createVendorPayment,
  getVendorPayments,
  assignOrderToVendor,
  getVendorActiveOrders,
  getAllVendorsCapacityStatus,
} from '../vendors.service';
import { VendorStatus, VendorTier, PaymentTerms } from '../vendors.interface';
import { pool } from '@packages/database';

describe('Vendors Module', () => {
  let testVendorId: number;
  let testAgreementId: number;
  let testPaymentId: number;

  beforeAll(async () => {
    // Setup: ensure tables exist
    try {
      await pool.query('SELECT 1 FROM vendors LIMIT 1');
    } catch (error) {
      console.log('Vendor tables may not exist yet. Run migrations first.');
    }
  });

  afterAll(async () => {
    // Cleanup test data if needed
    if (testVendorId) {
      try {
        await pool.query('DELETE FROM vendors WHERE id = $1', [testVendorId]);
      } catch (error) {
        // Silent cleanup failure
      }
    }
  });

  describe('Vendor Management', () => {
    it('should create a new vendor with basic info', async () => {
      const vendorData = {
        name: 'Test Vendor - Lahore',
        location: 'Lahore',
        country: 'Pakistan',
        specialization: 'T-shirts and casual wear',
        contact_email: 'contact@testvendor.com',
        contact_phone: '+92-123-456-7890',
        primary_contact_name: 'Ahmed Khan',
        monthly_capacity_min: 500,
        monthly_capacity_max: 2000,
        price_per_unit_min: 2.5,
        price_per_unit_max: 5.0,
        lead_time_standard_days: 40,
        lead_time_expedite_days: 20,
        minimum_order_qty: 100,
        status: VendorStatus.PROSPECT,
        tier: VendorTier.PREMIUM,
      };

      const vendor = await createVendor(vendorData);
      testVendorId = vendor.id;

      expect(vendor).toBeDefined();
      expect(vendor.name).toBe('Test Vendor - Lahore');
      expect(vendor.status).toBe(VendorStatus.PROSPECT);
      expect(vendor.location).toBe('Lahore');
    });

    it('should retrieve a vendor by ID', async () => {
      if (!testVendorId) return;
      const vendor = await getVendorById(testVendorId);
      expect(vendor).toBeDefined();
      expect(vendor?.id).toBe(testVendorId);
    });

    it('should retrieve all vendors', async () => {
      const vendors = await getVendors();
      expect(Array.isArray(vendors)).toBe(true);
    });

    it('should filter vendors by status', async () => {
      const vendors = await getVendors({ status: VendorStatus.ACTIVE });
      if (vendors.length > 0) {
        expect(vendors[0].status).toBe(VendorStatus.ACTIVE);
      }
    });

    it('should update a vendor', async () => {
      if (!testVendorId) return;
      const updated = await updateVendor(testVendorId, {
        status: VendorStatus.QUALIFIED,
        monthly_capacity_max: 3000,
      });

      expect(updated.status).toBe(VendorStatus.QUALIFIED);
      expect(updated.monthly_capacity_max).toBe(3000);
    });
  });

  describe('Vendor Agreements', () => {
    it('should create a vendor agreement', async () => {
      if (!testVendorId) return;
      const agreementData = {
        vendor_id: testVendorId,
        payment_terms: PaymentTerms.NET_30,
        price_per_unit: 3.5,
        minimum_order_qty: 100,
        price_tier_volume_1: 3.0,
        price_tier_volume_2: 2.8,
        terms_conditions: 'Standard terms apply',
      };

      const agreement = await createVendorAgreement(agreementData);
      testAgreementId = agreement.id;

      expect(agreement).toBeDefined();
      expect(Number(agreement.price_per_unit)).toBe(3.5);
      expect(agreement.payment_terms).toBe(PaymentTerms.NET_30);
    });

    it('should retrieve active vendor agreement', async () => {
      if (!testVendorId) return;
      const agreement = await getActiveVendorAgreement(testVendorId);
      if (agreement) {
        expect(agreement.vendor_id).toBe(testVendorId);
        expect(agreement.status).toBe('ACTIVE');
      }
    });
  });

  describe('Vendor Performance Metrics', () => {
    it('should record vendor performance metrics', async () => {
      if (!testVendorId) return;
      const now = new Date();
      const metric = await recordVendorPerformance({
        vendor_id: testVendorId,
        metric_month: now,
        total_orders: 10,
        on_time_delivery_count: 10,
        on_time_delivery_percentage: 100,
        defect_rate_percentage: 0.5,
        average_quality_score: 9.5,
        communication_response_hours: 4,
        price_variance_percentage: 0,
        volume_flexibility_score: 8.5,
      });

      expect(metric).toBeDefined();
      expect(metric.total_orders).toBe(10);
      expect(Number(metric.on_time_delivery_percentage)).toBe(100);
    });

    it('should retrieve vendor performance history', async () => {
      if (!testVendorId) return;
      const metrics = await getVendorPerformance(testVendorId, 6);
      expect(Array.isArray(metrics)).toBe(true);
    });
  });

  describe('Vendor Payments', () => {
    it('should create a vendor payment', async () => {
      if (!testVendorId) return;
      const paymentData = {
        vendor_id: testVendorId,
        payment_date: new Date(),
        amount: 500.0,
        currency: 'USD',
        payment_method: 'Wire Transfer',
        reference: 'INV-2024-001',
      };

      const payment = await createVendorPayment(paymentData);
      testPaymentId = payment.id;

      expect(payment).toBeDefined();
      expect(Number(payment.amount)).toBe(500.0);
      expect(payment.status).toBe('PENDING');
    });

    it('should retrieve vendor payments', async () => {
      if (!testVendorId) return;
      const payments = await getVendorPayments(testVendorId);
      expect(Array.isArray(payments)).toBe(true);
    });

    it('should filter vendor payments by status', async () => {
      if (!testVendorId) return;
      const payments = await getVendorPayments(testVendorId, { status: 'PENDING' });
      if (payments.length > 0) {
        expect(payments[0].status).toBe('PENDING');
      }
    });
  });

  describe('Capacity Planning', () => {
    it('should get all vendors capacity status', async () => {
      const capacityStatus = await getAllVendorsCapacityStatus();
      expect(Array.isArray(capacityStatus)).toBe(true);
      // Each vendor should have capacity info
      if (capacityStatus.length > 0) {
        expect(capacityStatus[0]).toHaveProperty('name');
        expect(capacityStatus[0]).toHaveProperty('monthly_capacity_max');
      }
    });
  });
});
