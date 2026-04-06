/**
 * PaymentService Unit Tests
 *
 * Tests for the PaymentService which handles payment processing.
 */

import { Types } from 'mongoose';
import { PaymentService } from '../../application/services/PaymentService';
import {
  createMockUser,
  createMockUserModel,
  createMockTenant,
  createMockTenantModel,
  createMockPayment,
  createMockPaymentModel,
  createMockPaymentGateway,
  createChainableQuery,
  createChainableDocumentQuery,
} from '../mocks/repositories';
import { NotFoundError, BadRequestError } from '../../domain/exceptions/AppError';
import { PaymentGatewayFactory } from '../../infrastructure/factories/PaymentGatewayFactory';

// Mock the PaymentGatewayFactory
jest.mock('../../infrastructure/factories/PaymentGatewayFactory', () => ({
  PaymentGatewayFactory: {
    getGateway: jest.fn(),
    getDefaultGateway: jest.fn(),
    getDefaultGatewayType: jest.fn().mockReturnValue('chapa'),
    clearInstances: jest.fn(),
  },
}));

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockPaymentModel: ReturnType<typeof createMockPaymentModel>;
  let mockTenantModel: ReturnType<typeof createMockTenantModel>;
  let mockUserModel: ReturnType<typeof createMockUserModel>;
  let mockPaymentGateway: ReturnType<typeof createMockPaymentGateway>;

  beforeEach(() => {
    mockPaymentModel = createMockPaymentModel();
    mockTenantModel = createMockTenantModel();
    mockUserModel = createMockUserModel();
    mockPaymentGateway = createMockPaymentGateway();

    // Setup gateway mock
    (PaymentGatewayFactory.getGateway as jest.Mock).mockReturnValue(mockPaymentGateway);

    paymentService = new PaymentService(
      mockPaymentModel as any,
      mockTenantModel as any,
      mockUserModel as any
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializePayment', () => {
    const tenantId = new Types.ObjectId().toString();
    const initializePaymentData = {
      tenantId,
      amount: 15000,
      type: 'rent',
      month: 3,
      year: 2024,
      dueDate: '2024-03-01',
    };

    it('should successfully initialize payment with default gateway', async () => {
      // Arrange
      const mockTenant = createMockTenant({
        _id: new Types.ObjectId(tenantId),
      });
      const mockUser = createMockUser({ name: 'Test Tenant' });
      const mockCreatedPayment = createMockPayment({
        tenantId: new Types.ObjectId(tenantId),
        amount: initializePaymentData.amount,
        type: initializePaymentData.type,
        status: 'pending',
      });

      const tenantQuery = createChainableDocumentQuery(mockTenant);
      mockTenantModel.findById.mockReturnValue(tenantQuery);
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockPaymentModel.create.mockResolvedValue(mockCreatedPayment);

      mockPaymentGateway.generateTransactionRef.mockReturnValue('ENDER-test-tx-123');
      mockPaymentGateway.initializePayment.mockResolvedValue({
        success: true,
        checkoutUrl: 'https://checkout.example.com/pay',
        transactionRef: 'ENDER-test-tx-123',
        gatewayReference: 'gateway-ref-123',
      });

      // Act
      const result = await paymentService.initializePayment(initializePaymentData);

      // Assert
      expect(mockTenantModel.findById).toHaveBeenCalledWith(tenantId);
      expect(mockUserModel.findById).toHaveBeenCalledWith(mockTenant.userId);
      expect(mockPaymentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: initializePaymentData.amount,
          type: initializePaymentData.type,
          status: 'pending',
        })
      );
      expect(result).toHaveProperty('payment');
      expect(result).toHaveProperty('checkoutUrl');
    });

    it('should initialize payment with specified gateway', async () => {
      // Arrange
      const dataWithGateway = {
        ...initializePaymentData,
        gateway: 'telebirr' as const,
      };

      const mockTenant = createMockTenant({ _id: new Types.ObjectId(tenantId) });
      const mockUser = createMockUser();
      const mockCreatedPayment = createMockPayment();

      const tenantQuery = createChainableDocumentQuery(mockTenant);
      mockTenantModel.findById.mockReturnValue(tenantQuery);
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockPaymentModel.create.mockResolvedValue(mockCreatedPayment);

      // Act
      await paymentService.initializePayment(dataWithGateway);

      // Assert
      expect(PaymentGatewayFactory.getGateway).toHaveBeenCalledWith('telebirr');
    });

    it('should throw NotFoundError when tenant does not exist', async () => {
      // Arrange
      const tenantQuery = createChainableDocumentQuery(null);
      mockTenantModel.findById.mockReturnValue(tenantQuery);

      // Act & Assert
      await expect(paymentService.initializePayment(initializePaymentData)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw NotFoundError when user associated with tenant does not exist', async () => {
      // Arrange
      const mockTenant = createMockTenant({ _id: new Types.ObjectId(tenantId) });

      const tenantQuery = createChainableDocumentQuery(mockTenant);
      mockTenantModel.findById.mockReturnValue(tenantQuery);
      mockUserModel.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(paymentService.initializePayment(initializePaymentData)).rejects.toThrow(
        NotFoundError
      );
      await expect(paymentService.initializePayment(initializePaymentData)).rejects.toThrow(
        'User associated with tenant not found'
      );
    });

    it('should handle user name parsing correctly', async () => {
      // Arrange
      const mockTenant = createMockTenant({ _id: new Types.ObjectId(tenantId) });
      const mockUser = createMockUser({ name: 'John Michael Doe' });
      const mockCreatedPayment = createMockPayment();

      const tenantQuery = createChainableDocumentQuery(mockTenant);
      mockTenantModel.findById.mockReturnValue(tenantQuery);
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockPaymentModel.create.mockResolvedValue(mockCreatedPayment);

      // Act
      await paymentService.initializePayment(initializePaymentData);

      // Assert
      expect(mockPaymentGateway.initializePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Michael Doe',
        })
      );
    });
  });

  describe('verifyPayment', () => {
    const txRef = 'ENDER-test-tx-123';

    it('should successfully verify a completed payment', async () => {
      // Arrange
      const mockPayment = createMockPayment({
        gatewayTransactionRef: txRef,
        status: 'pending',
        paymentMethod: 'chapa',
      });

      mockPaymentModel.findOne.mockResolvedValue(mockPayment);
      mockPaymentGateway.verifyPayment.mockResolvedValue({
        success: true,
        status: 'success',
        transactionRef: txRef,
        gatewayReference: 'gateway-ref-123',
        amount: 15000,
        currency: 'ETB',
        paidAt: new Date(),
      });

      // Act
      const result = await paymentService.verifyPayment(txRef);

      // Assert
      expect(mockPaymentModel.findOne).toHaveBeenCalledWith({
        $or: [{ gatewayTransactionRef: txRef }, { chapaTxRef: txRef }],
      });
      expect(mockPaymentGateway.verifyPayment).toHaveBeenCalledWith(txRef);
      expect(mockPayment.status).toBe('completed');
      expect(mockPayment.receipt).toBeDefined();
      expect(mockPayment.save).toHaveBeenCalled();
    });

    it('should throw NotFoundError when payment does not exist', async () => {
      // Arrange
      mockPaymentModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(paymentService.verifyPayment(txRef)).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when verification fails', async () => {
      // Arrange
      const mockPayment = createMockPayment({
        gatewayTransactionRef: txRef,
        status: 'pending',
        paymentMethod: 'chapa',
      });

      mockPaymentModel.findOne.mockResolvedValue(mockPayment);
      mockPaymentGateway.verifyPayment.mockResolvedValue({
        success: false,
        status: 'failed',
        transactionRef: txRef,
        gatewayReference: '',
        amount: 15000,
        currency: 'ETB',
      });

      // Act & Assert
      await expect(paymentService.verifyPayment(txRef)).rejects.toThrow(BadRequestError);
      await expect(paymentService.verifyPayment(txRef)).rejects.toThrow(
        'Payment verification failed'
      );
    });

    it('should set payment status to failed when verification fails', async () => {
      // Arrange
      const mockPayment = createMockPayment({
        gatewayTransactionRef: txRef,
        status: 'pending',
        paymentMethod: 'chapa',
      });

      mockPaymentModel.findOne.mockResolvedValue(mockPayment);
      mockPaymentGateway.verifyPayment.mockResolvedValue({
        success: false,
        status: 'failed',
        transactionRef: txRef,
        gatewayReference: '',
        amount: 15000,
        currency: 'ETB',
      });

      // Act & Assert
      await expect(paymentService.verifyPayment(txRef)).rejects.toThrow();
      expect(mockPayment.status).toBe('failed');
      expect(mockPayment.save).toHaveBeenCalled();
    });
  });

  describe('createManualPayment', () => {
    const tenantId = new Types.ObjectId().toString();
    const ownerId = new Types.ObjectId().toString();
    const createManualPaymentData = {
      tenantId,
      ownerId,
      amount: 15000,
      type: 'rent',
      month: 3,
      year: 2024,
      dueDate: '2024-03-01',
      notes: 'Cash payment received',
    };

    it('should successfully create a manual payment', async () => {
      // Arrange
      const mockTenant = createMockTenant({
        _id: new Types.ObjectId(tenantId),
        ownerId: new Types.ObjectId(ownerId),
      });
      const mockCreatedPayment = createMockPayment({
        tenantId: new Types.ObjectId(createManualPaymentData.tenantId),
        ownerId: new Types.ObjectId(createManualPaymentData.ownerId),
        amount: createManualPaymentData.amount,
        type: createManualPaymentData.type,
        month: createManualPaymentData.month,
        year: createManualPaymentData.year,
        status: 'completed',
        paymentMethod: 'manual',
      });

      mockTenantModel.findOne.mockResolvedValue(mockTenant);
      mockPaymentModel.create.mockResolvedValue(mockCreatedPayment);

      // Act
      const result = await paymentService.createManualPayment(createManualPaymentData);

      // Assert
      expect(mockTenantModel.findOne).toHaveBeenCalledWith({
        _id: expect.any(Types.ObjectId),
        ownerId: expect.any(Types.ObjectId),
      });
      expect(mockPaymentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          paymentMethod: 'manual',
          receipt: expect.objectContaining({
            number: expect.any(String),
            generatedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should throw NotFoundError when tenant does not belong to owner', async () => {
      // Arrange
      mockTenantModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(paymentService.createManualPayment(createManualPaymentData)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('submitBankTransfer', () => {
    const tenantId = new Types.ObjectId().toString();
    const submitBankTransferData = {
      tenantId,
      amount: 15000,
      type: 'rent',
      month: 3,
      year: 2024,
      dueDate: '2024-03-01',
      receiptUrl: 'https://example.com/receipt.jpg',
    };

    it('should successfully submit bank transfer payment', async () => {
      // Arrange
      const mockTenant = createMockTenant({ _id: new Types.ObjectId(tenantId) });
      const mockCreatedPayment = createMockPayment({
        tenantId: new Types.ObjectId(submitBankTransferData.tenantId),
        amount: submitBankTransferData.amount,
        type: submitBankTransferData.type,
        month: submitBankTransferData.month,
        year: submitBankTransferData.year,
        status: 'pending',
        paymentMethod: 'bank_transfer',
        bankTransferApprovalStatus: 'pending_approval',
      });

      mockTenantModel.findById.mockResolvedValue(mockTenant);
      mockPaymentModel.create.mockResolvedValue(mockCreatedPayment);

      // Act
      const result = await paymentService.submitBankTransfer(submitBankTransferData);

      // Assert
      expect(mockPaymentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: 'bank_transfer',
          bankTransferReceipt: submitBankTransferData.receiptUrl,
          bankTransferApprovalStatus: 'pending_approval',
        })
      );
    });

    it('should throw NotFoundError when tenant does not exist', async () => {
      // Arrange
      mockTenantModel.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(paymentService.submitBankTransfer(submitBankTransferData)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('approvePayment', () => {
    const paymentId = new Types.ObjectId().toString();
    const approverId = new Types.ObjectId().toString();

    it('should successfully approve bank transfer payment', async () => {
      // Arrange
      const mockPayment = createMockPayment({
        _id: new Types.ObjectId(paymentId),
        paymentMethod: 'bank_transfer',
        bankTransferApprovalStatus: 'pending_approval',
        status: 'pending',
      });

      mockPaymentModel.findById.mockResolvedValue(mockPayment);

      // Act
      const result = await paymentService.approvePayment(paymentId, approverId, 'Approved');

      // Assert
      expect(mockPayment.status).toBe('completed');
      expect(mockPayment.bankTransferApprovalStatus).toBe('approved');
      expect(mockPayment.bankTransferApprovalNotes).toBe('Approved');
      expect(mockPayment.approvedBy).toEqual(expect.any(Types.ObjectId));
      expect(mockPayment.receipt).toBeDefined();
      expect(mockPayment.save).toHaveBeenCalled();
    });

    it('should throw NotFoundError when payment does not exist', async () => {
      // Arrange
      mockPaymentModel.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(paymentService.approvePayment(paymentId, approverId)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw BadRequestError for non-bank transfer payment', async () => {
      // Arrange
      const mockPayment = createMockPayment({
        _id: new Types.ObjectId(paymentId),
        paymentMethod: 'chapa',
      });

      mockPaymentModel.findById.mockResolvedValue(mockPayment);

      // Act & Assert
      await expect(paymentService.approvePayment(paymentId, approverId)).rejects.toThrow(
        BadRequestError
      );
      await expect(paymentService.approvePayment(paymentId, approverId)).rejects.toThrow(
        'Only bank transfer payments can be approved'
      );
    });

    it('should throw BadRequestError when payment is not pending approval', async () => {
      // Arrange
      const mockPayment = createMockPayment({
        _id: new Types.ObjectId(paymentId),
        paymentMethod: 'bank_transfer',
        bankTransferApprovalStatus: 'approved',
      });

      mockPaymentModel.findById.mockResolvedValue(mockPayment);

      // Act & Assert
      await expect(paymentService.approvePayment(paymentId, approverId)).rejects.toThrow(
        BadRequestError
      );
      await expect(paymentService.approvePayment(paymentId, approverId)).rejects.toThrow(
        'Payment is not pending approval'
      );
    });
  });

  describe('rejectPayment', () => {
    const paymentId = new Types.ObjectId().toString();
    const approverId = new Types.ObjectId().toString();

    it('should successfully reject bank transfer payment', async () => {
      // Arrange
      const mockPayment = createMockPayment({
        _id: new Types.ObjectId(paymentId),
        paymentMethod: 'bank_transfer',
        bankTransferApprovalStatus: 'pending_approval',
        status: 'pending',
      });

      mockPaymentModel.findById.mockResolvedValue(mockPayment);

      // Act
      const result = await paymentService.rejectPayment(
        paymentId,
        approverId,
        'Invalid receipt'
      );

      // Assert
      expect(mockPayment.status).toBe('failed');
      expect(mockPayment.bankTransferApprovalStatus).toBe('rejected');
      expect(mockPayment.bankTransferApprovalNotes).toBe('Invalid receipt');
      expect(mockPayment.save).toHaveBeenCalled();
    });

    it('should throw NotFoundError when payment does not exist', async () => {
      // Arrange
      mockPaymentModel.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(paymentService.rejectPayment(paymentId, approverId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('getPayments', () => {
    const userId = new Types.ObjectId().toString();

    it('should return paginated payments for owner', async () => {
      // Arrange
      const mockPayments = [
        createMockPayment({ ownerId: new Types.ObjectId(userId) }),
        createMockPayment({ ownerId: new Types.ObjectId(userId) }),
      ];

      const chainableQuery = createChainableQuery(mockPayments);
      mockPaymentModel.find.mockReturnValue(chainableQuery);
      mockPaymentModel.countDocuments.mockResolvedValue(2);

      // Act
      const result = await paymentService.getPayments(userId, 'owner', { page: 1, limit: 10 });

      // Assert
      expect(mockPaymentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: expect.any(Types.ObjectId) })
      );
      expect(result).toHaveProperty('payments');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination.total).toBe(2);
    });

    it('should return payments for tenant role', async () => {
      // Arrange
      const mockTenant = createMockTenant({ userId: new Types.ObjectId(userId), status: 'active' });
      const mockPayments = [createMockPayment({ tenantId: mockTenant._id })];

      mockTenantModel.findOne.mockResolvedValue(mockTenant);

      const chainableQuery = createChainableQuery(mockPayments);
      mockPaymentModel.find.mockReturnValue(chainableQuery);
      mockPaymentModel.countDocuments.mockResolvedValue(1);

      // Act
      const result = await paymentService.getPayments(userId, 'tenant', { page: 1, limit: 10 });

      // Assert
      expect(mockTenantModel.findOne).toHaveBeenCalledWith({
        userId: expect.any(Types.ObjectId),
        status: 'active',
      });
      expect(mockPaymentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: mockTenant._id })
      );
    });

    it('should return empty result for tenant with no active tenancy', async () => {
      // Arrange
      mockTenantModel.findOne.mockResolvedValue(null);

      // Act
      const result = await paymentService.getPayments(userId, 'tenant', { page: 1, limit: 10 });

      // Assert
      expect(result.payments).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should filter by status', async () => {
      // Arrange
      const mockPayments = [createMockPayment({ status: 'completed' })];

      const chainableQuery = createChainableQuery(mockPayments);
      mockPaymentModel.find.mockReturnValue(chainableQuery);
      mockPaymentModel.countDocuments.mockResolvedValue(1);

      // Act
      const result = await paymentService.getPayments(userId, 'owner', {
        page: 1,
        limit: 10,
        status: 'completed',
      });

      // Assert
      expect(mockPaymentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed' })
      );
    });

    it('should filter by month and year', async () => {
      // Arrange
      const mockPayments = [createMockPayment({ month: 3, year: 2024 })];

      const chainableQuery = createChainableQuery(mockPayments);
      mockPaymentModel.find.mockReturnValue(chainableQuery);
      mockPaymentModel.countDocuments.mockResolvedValue(1);

      // Act
      const result = await paymentService.getPayments(userId, 'owner', {
        page: 1,
        limit: 10,
        month: 3,
        year: 2024,
      });

      // Assert
      expect(mockPaymentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ month: 3, year: 2024 })
      );
    });
  });

  describe('getPayment', () => {
    const paymentId = new Types.ObjectId().toString();

    it('should return a single payment with populated fields', async () => {
      // Arrange
      const mockPayment = createMockPayment({ _id: new Types.ObjectId(paymentId) });

      const chainableQuery = createChainableQuery(mockPayment);
      mockPaymentModel.findById.mockReturnValue(chainableQuery);

      // Act
      const result = await paymentService.getPayment(paymentId);

      // Assert
      expect(mockPaymentModel.findById).toHaveBeenCalledWith(paymentId);
      expect(chainableQuery.populate).toHaveBeenCalled();
    });

    it('should throw NotFoundError when payment does not exist', async () => {
      // Arrange
      const chainableQuery = createChainableQuery(null);
      mockPaymentModel.findById.mockReturnValue(chainableQuery);

      // Act & Assert
      await expect(paymentService.getPayment(paymentId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getPendingApprovalPayments', () => {
    const ownerId = new Types.ObjectId().toString();

    it('should return pending bank transfer payments', async () => {
      // Arrange
      const mockPayments = [
        createMockPayment({
          ownerId: new Types.ObjectId(ownerId),
          paymentMethod: 'bank_transfer',
          bankTransferApprovalStatus: 'pending_approval',
        }),
      ];

      const chainableQuery = createChainableQuery(mockPayments);
      mockPaymentModel.find.mockReturnValue(chainableQuery);
      mockPaymentModel.countDocuments.mockResolvedValue(1);

      // Act
      const result = await paymentService.getPendingApprovalPayments(ownerId, {
        page: 1,
        limit: 10,
      });

      // Assert
      expect(mockPaymentModel.find).toHaveBeenCalledWith({
        ownerId: expect.any(Types.ObjectId),
        paymentMethod: 'bank_transfer',
        bankTransferApprovalStatus: 'pending_approval',
      });
      expect(result.payments.length).toBe(1);
    });
  });

  describe('getPaymentStats', () => {
    const ownerId = new Types.ObjectId().toString();

    it('should return payment statistics for the year', async () => {
      // Arrange
      const monthlyStats = [
        { _id: { month: 1, status: 'completed' }, total: 30000, count: 2 },
        { _id: { month: 2, status: 'pending' }, total: 15000, count: 1 },
      ];
      const summary = [
        { _id: 'completed', total: 30000, count: 2 },
        { _id: 'pending', total: 15000, count: 1 },
      ];

      mockPaymentModel.aggregate
        .mockResolvedValueOnce(monthlyStats)
        .mockResolvedValueOnce(summary);

      // Act
      const result = await paymentService.getPaymentStats(ownerId, 2024);

      // Assert
      expect(mockPaymentModel.aggregate).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('monthlyStats');
      expect(result).toHaveProperty('summary');
    });

    it('should use current year if not specified', async () => {
      // Arrange
      mockPaymentModel.aggregate.mockResolvedValue([]);

      // Act
      await paymentService.getPaymentStats(ownerId);

      // Assert
      expect(mockPaymentModel.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              year: new Date().getFullYear(),
            }),
          }),
        ])
      );
    });
  });

  describe('handleWebhook', () => {
    const webhookData = {
      tx_ref: 'ENDER-test-tx-123',
      status: 'success',
      reference: 'chapa-ref-123',
    };

    it('should successfully process webhook and update payment', async () => {
      // Arrange
      const mockPayment = createMockPayment({
        gatewayTransactionRef: webhookData.tx_ref,
        status: 'pending',
        paymentMethod: 'chapa',
      });

      mockPaymentGateway.verifyWebhookSignature.mockResolvedValue(true);
      mockPaymentGateway.parseWebhookData.mockReturnValue({
        transactionRef: webhookData.tx_ref,
        status: 'success',
        gatewayReference: webhookData.reference,
      });
      mockPaymentModel.findOne.mockResolvedValue(mockPayment);

      // Act
      await paymentService.handleWebhook('chapa', webhookData, 'signature');

      // Assert
      expect(mockPaymentGateway.verifyWebhookSignature).toHaveBeenCalledWith(
        webhookData,
        'signature'
      );
      expect(mockPayment.status).toBe('completed');
      expect(mockPayment.save).toHaveBeenCalled();
    });

    it('should throw BadRequestError for invalid webhook signature', async () => {
      // Arrange
      mockPaymentGateway.verifyWebhookSignature.mockResolvedValue(false);

      // Act & Assert
      await expect(
        paymentService.handleWebhook('chapa', webhookData, 'invalid-signature')
      ).rejects.toThrow(BadRequestError);
      await expect(
        paymentService.handleWebhook('chapa', webhookData, 'invalid-signature')
      ).rejects.toThrow('Invalid webhook signature');
    });

    it('should handle failed payment status from webhook', async () => {
      // Arrange
      const mockPayment = createMockPayment({
        gatewayTransactionRef: webhookData.tx_ref,
        status: 'pending',
        paymentMethod: 'chapa',
      });

      mockPaymentGateway.verifyWebhookSignature.mockResolvedValue(true);
      mockPaymentGateway.parseWebhookData.mockReturnValue({
        transactionRef: webhookData.tx_ref,
        status: 'failed',
        gatewayReference: webhookData.reference,
      });
      mockPaymentModel.findOne.mockResolvedValue(mockPayment);

      // Act
      await paymentService.handleWebhook('chapa', webhookData, 'signature');

      // Assert
      expect(mockPayment.status).toBe('failed');
      expect(mockPayment.save).toHaveBeenCalled();
    });

    it('should silently return when payment not found for webhook', async () => {
      // Arrange
      mockPaymentGateway.verifyWebhookSignature.mockResolvedValue(true);
      mockPaymentGateway.parseWebhookData.mockReturnValue({
        transactionRef: 'unknown-tx-ref',
        status: 'success',
        gatewayReference: 'ref-123',
      });
      mockPaymentModel.findOne.mockResolvedValue(null);

      // Act - should not throw
      await paymentService.handleWebhook('chapa', webhookData, 'signature');

      // Assert - no error thrown
      expect(mockPaymentModel.findOne).toHaveBeenCalled();
    });
  });

  describe('getPaymentCalendar', () => {
    const userId = new Types.ObjectId().toString();
    const options = { year: 2024, month: 3 };

    it('should return payment calendar data for owner', async () => {
      // Arrange
      const mockPayments = [
        createMockPayment({
          ownerId: new Types.ObjectId(userId),
          dueDate: new Date('2024-03-15'),
          status: 'completed',
        }),
        createMockPayment({
          ownerId: new Types.ObjectId(userId),
          dueDate: new Date('2024-03-20'),
          status: 'pending',
        }),
      ];

      const chainableQuery = createChainableQuery(mockPayments);
      mockPaymentModel.find.mockReturnValue(chainableQuery);

      // Act
      const result = await paymentService.getPaymentCalendar(userId, 'owner', options);

      // Assert
      expect(mockPaymentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          year: 2024,
          month: 3,
          ownerId: expect.any(Types.ObjectId),
        })
      );
      expect(result).toHaveProperty('payments');
      expect(result).toHaveProperty('days');
    });

    it('should return empty result for tenant with no active tenancy', async () => {
      // Arrange
      mockTenantModel.findOne.mockResolvedValue(null);

      // Act
      const result = await paymentService.getPaymentCalendar(userId, 'tenant', options);

      // Assert
      expect(result).toEqual({ payments: [], days: {} });
    });
  });

  describe('getPaymentReminders', () => {
    const userId = new Types.ObjectId().toString();

    it('should return upcoming and overdue payment reminders', async () => {
      // Arrange
      const today = new Date();
      const upcomingDate = new Date(today);
      upcomingDate.setDate(upcomingDate.getDate() + 7);
      const overdueDate = new Date(today);
      overdueDate.setDate(overdueDate.getDate() - 7);

      const mockPayments = [
        createMockPayment({
          ownerId: new Types.ObjectId(userId),
          dueDate: upcomingDate,
          status: 'pending',
        }),
        createMockPayment({
          ownerId: new Types.ObjectId(userId),
          dueDate: overdueDate,
          status: 'pending',
        }),
      ];

      const chainableQuery = createChainableQuery(mockPayments);
      mockPaymentModel.find.mockReturnValue(chainableQuery);

      // Act
      const result = await paymentService.getPaymentReminders(userId, 'owner');

      // Assert
      expect(result).toHaveProperty('upcoming');
      expect(result).toHaveProperty('overdue');
    });

    it('should return empty result for tenant with no active tenancy', async () => {
      // Arrange
      mockTenantModel.findOne.mockResolvedValue(null);

      // Act
      const result = await paymentService.getPaymentReminders(userId, 'tenant');

      // Assert
      expect(result).toEqual({ upcoming: [], overdue: [] });
    });
  });
});
