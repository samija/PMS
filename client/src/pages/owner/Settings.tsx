import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, CreditCard, Building2, Save, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { settingsAPI } from '../../services/api';
import type { EthiopianBank, PreferredPaymentMethod } from '../../types';

const ETHIOPIAN_BANKS: EthiopianBank[] = [
  'CBE',
  'Awash Bank',
  'Dashen Bank',
  'Bank of Abyssinia',
  'Wegagen Bank',
  'United Bank',
  'Nib International Bank',
  'Zemen Bank',
  'Cooperative Bank of Oromia',
  'Abay Bank',
  'Berhan Bank',
  'Bunna International Bank',
];

const PAYMENT_METHODS: { value: PreferredPaymentMethod; label: string }[] = [
  { value: 'chapa', label: 'Chapa' },
  { value: 'telebirr', label: 'TeleBirr' },
  { value: 'santimpay', label: 'SantimPay' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

export default function Settings() {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    preferredPaymentMethod: 'chapa' as PreferredPaymentMethod,
    bankDetails: {
      bankName: '' as EthiopianBank | '',
      accountNumber: '',
      accountHolderName: '',
    },
    paymentInstructions: '',
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['payment-settings'],
    queryFn: () => settingsAPI.getPaymentSettings(),
  });

  const settings = data?.data?.data?.settings;

  useEffect(() => {
    if (settings) {
      setFormData({
        preferredPaymentMethod: settings.preferredPaymentMethod || 'chapa',
        bankDetails: {
          bankName: settings.bankDetails?.bankName || '',
          accountNumber: settings.bankDetails?.accountNumber || '',
          accountHolderName: settings.bankDetails?.accountHolderName || '',
        },
        paymentInstructions: settings.paymentInstructions || '',
        isActive: settings.isActive ?? true,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => settingsAPI.updatePaymentSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-settings'] });
      toast.success('Payment settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate bank details if bank_transfer is selected
    if (formData.preferredPaymentMethod === 'bank_transfer') {
      if (!formData.bankDetails.bankName || !formData.bankDetails.accountNumber || !formData.bankDetails.accountHolderName) {
        toast.error('Bank details are required for bank transfer');
        return;
      }
    }

    const payload: any = {
      preferredPaymentMethod: formData.preferredPaymentMethod,
      paymentInstructions: formData.paymentInstructions || undefined,
      isActive: formData.isActive,
    };

    // Only include bank details if filled
    if (formData.bankDetails.bankName && formData.bankDetails.accountNumber && formData.bankDetails.accountHolderName) {
      payload.bankDetails = formData.bankDetails;
    }

    updateMutation.mutate(payload);
  };

  const handlePaymentMethodChange = (method: PreferredPaymentMethod) => {
    setFormData((prev) => ({
      ...prev,
      preferredPaymentMethod: method,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <SettingsIcon className="h-8 w-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">Configure your payment preferences and bank details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Payment Method Selection */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Preferred Payment Method</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Select the payment method you prefer tenants to use when paying rent
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => handlePaymentMethodChange(method.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.preferredPaymentMethod === method.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-center">
                    <CreditCard className={`h-6 w-6 mx-auto mb-2 ${
                      formData.preferredPaymentMethod === method.value
                        ? 'text-primary-600'
                        : 'text-gray-400'
                    }`} />
                    <span className="font-medium">{method.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Bank Details */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Bank Details</h2>
              {formData.preferredPaymentMethod === 'bank_transfer' && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Required</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Your bank account details for receiving payments via bank transfer
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Bank Name"
                value={formData.bankDetails.bankName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, bankName: e.target.value as EthiopianBank },
                  }))
                }
                required={formData.preferredPaymentMethod === 'bank_transfer'}
                options={[
                  { value: '', label: 'Select a bank' },
                  ...ETHIOPIAN_BANKS.map((bank) => ({ value: bank, label: bank })),
                ]}
              />

              <Input
                label="Account Number"
                type="text"
                value={formData.bankDetails.accountNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, accountNumber: e.target.value },
                  }))
                }
                placeholder="Enter account number"
                required={formData.preferredPaymentMethod === 'bank_transfer'}
              />

              <Input
                label="Account Holder Name"
                type="text"
                value={formData.bankDetails.accountHolderName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, accountHolderName: e.target.value },
                  }))
                }
                placeholder="Enter account holder name"
                className="md:col-span-2"
                required={formData.preferredPaymentMethod === 'bank_transfer'}
              />
            </div>
          </div>
        </Card>

        {/* Payment Instructions */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Info className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Payment Instructions</h2>
              <span className="text-xs text-gray-400">(Optional)</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Add any special instructions for your tenants when making payments
            </p>

            <textarea
              value={formData.paymentInstructions}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, paymentInstructions: e.target.value }))
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Please include your unit number as payment reference..."
              maxLength={1000}
            />
            <p className="text-xs text-gray-400 mt-1">
              {formData.paymentInstructions.length}/1000 characters
            </p>
          </div>
        </Card>

        {/* Active Status */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Payment Settings Status</h2>
                <p className="text-sm text-gray-500">
                  Enable or disable these payment settings for your tenants
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </label>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            loading={updateMutation.isPending}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
