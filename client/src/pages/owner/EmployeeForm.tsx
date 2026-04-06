import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Search, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import api from '../../services/api';

const DEPARTMENTS = [
  'Management',
  'Maintenance',
  'Security',
  'Cleaning',
  'Administration',
  'Finance',
  'Customer Service',
];

const DEPARTMENT_OPTIONS = [
  { value: '', label: 'Select Department' },
  ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
];

const GENDER_OPTIONS = [
  { value: '', label: 'Select Gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: '', label: 'Select Type' },
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
];

const PAYMENT_FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'bi_weekly', label: 'Bi-Weekly' },
  { value: 'weekly', label: 'Weekly' },
];

export default function EmployeeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [userSearch, setUserSearch] = useState('');
  const [showUserResults, setShowUserResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    userId: '',
    dateOfBirth: '',
    gender: '',
    nationalId: '',
    address: '',
    city: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    position: '',
    department: '',
    employmentType: '',
    startDate: '',
    baseSalary: '',
    paymentFrequency: 'monthly',
    bankName: '',
    accountNumber: '',
  });

  // Fetch existing employee data when editing
  const { data: employeeData, isLoading: isLoadingEmployee } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => api.get(`/employees/${id}`),
    enabled: isEditing,
  });

  // User search
  const { data: userSearchData, isLoading: isSearchingUsers } = useQuery({
    queryKey: ['user-search', userSearch],
    queryFn: () => api.get('/users/search', { params: { q: userSearch } }),
    enabled: userSearch.length >= 2 && !isEditing,
  });

  const userResults = userSearchData?.data?.data?.users || [];

  // Populate form when editing
  useEffect(() => {
    if (employeeData?.data?.data) {
      const emp = employeeData.data.data;
      setSelectedUser(emp.userId);
      setFormData({
        userId: emp.userId?._id || '',
        dateOfBirth: emp.dateOfBirth
          ? new Date(emp.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: emp.gender || '',
        nationalId: emp.nationalId || '',
        address: emp.address || '',
        city: emp.city || '',
        emergencyContactName: emp.emergencyContact?.name || '',
        emergencyContactPhone: emp.emergencyContact?.phone || '',
        emergencyContactRelationship: emp.emergencyContact?.relationship || '',
        position: emp.position || '',
        department: emp.department || '',
        employmentType: emp.employmentType || '',
        startDate: emp.startDate
          ? new Date(emp.startDate).toISOString().split('T')[0]
          : '',
        baseSalary: emp.salary?.baseSalary?.toString() || '',
        paymentFrequency: emp.salary?.paymentFrequency || 'monthly',
        bankName: emp.salary?.bankName || '',
        accountNumber: emp.salary?.accountNumber || '',
      });
    }
  }, [employeeData]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/employees', data),
    onSuccess: () => {
      toast.success('Employee created successfully');
      navigate('/owner/employees');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create employee');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/employees/${id}`, data),
    onSuccess: () => {
      toast.success('Employee updated successfully');
      navigate(`/owner/employees/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update employee');
    },
  });

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setFormData({ ...formData, userId: user._id });
    setUserSearch('');
    setShowUserResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId && !isEditing) {
      toast.error('Please select a user');
      return;
    }

    const payload: any = {
      userId: formData.userId,
      dateOfBirth: formData.dateOfBirth || undefined,
      gender: formData.gender || undefined,
      nationalId: formData.nationalId || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      position: formData.position,
      department: formData.department,
      employmentType: formData.employmentType,
      startDate: formData.startDate,
      salary: {
        baseSalary: Number(formData.baseSalary) || 0,
        paymentFrequency: formData.paymentFrequency,
        bankName: formData.bankName || undefined,
        accountNumber: formData.accountNumber || undefined,
      },
    };

    if (
      formData.emergencyContactName ||
      formData.emergencyContactPhone
    ) {
      payload.emergencyContact = {
        name: formData.emergencyContactName,
        phone: formData.emergencyContactPhone,
        relationship: formData.emergencyContactRelationship,
      };
    }

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoadingEmployee) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-96 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/owner/employees')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Employee' : 'Add New Employee'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {isEditing
              ? 'Update employee information'
              : 'Fill in the details to add a new employee'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Selection */}
        {!isEditing && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">User Selection</h2>
            {selectedUser ? (
              <div className="flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedUser.name}</p>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedUser(null);
                    setFormData({ ...formData, userId: '' });
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search users by name or email..."
                    className="pl-10"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setShowUserResults(true);
                    }}
                    onFocus={() => setShowUserResults(true)}
                  />
                  {isSearchingUsers && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                  )}
                </div>
                {showUserResults && userSearch.length >= 2 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {userResults.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        {isSearchingUsers ? 'Searching...' : 'No users found'}
                      </div>
                    ) : (
                      userResults.map((user: any) => (
                        <button
                          key={user._id}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0"
                          onClick={() => handleSelectUser(user)}
                        >
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-600 font-medium text-sm">
                              {user.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {isEditing && selectedUser && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">User</h2>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedUser.name}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Personal Information */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) =>
                setFormData({ ...formData, dateOfBirth: e.target.value })
              }
            />
            <Select
              label="Gender"
              options={GENDER_OPTIONS}
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
            />
            <Input
              label="National ID"
              value={formData.nationalId}
              onChange={(e) =>
                setFormData({ ...formData, nationalId: e.target.value })
              }
              placeholder="Enter national ID number"
            />
            <Input
              label="City"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              placeholder="Enter city"
            />
            <div className="sm:col-span-2">
              <Input
                label="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter full address"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium text-gray-900 mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Name"
                value={formData.emergencyContactName}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContactName: e.target.value })
                }
                placeholder="Contact name"
              />
              <Input
                label="Phone"
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContactPhone: e.target.value })
                }
                placeholder="Contact phone"
              />
              <Input
                label="Relationship"
                value={formData.emergencyContactRelationship}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContactRelationship: e.target.value,
                  })
                }
                placeholder="e.g. Spouse, Parent"
              />
            </div>
          </div>
        </Card>

        {/* Employment Details */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Employment Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Position"
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: e.target.value })
              }
              placeholder="e.g. Property Manager"
              required
            />
            <Select
              label="Department"
              options={DEPARTMENT_OPTIONS}
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              required
            />
            <Select
              label="Employment Type"
              options={EMPLOYMENT_TYPE_OPTIONS}
              value={formData.employmentType}
              onChange={(e) =>
                setFormData({ ...formData, employmentType: e.target.value })
              }
              required
            />
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              required
            />
          </div>
        </Card>

        {/* Salary Information */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Salary Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Base Salary (ETB)"
              type="number"
              min="0"
              value={formData.baseSalary}
              onChange={(e) =>
                setFormData({ ...formData, baseSalary: e.target.value })
              }
              placeholder="Enter base salary"
              required
            />
            <Select
              label="Payment Frequency"
              options={PAYMENT_FREQUENCY_OPTIONS}
              value={formData.paymentFrequency}
              onChange={(e) =>
                setFormData({ ...formData, paymentFrequency: e.target.value })
              }
            />
            <Input
              label="Bank Name"
              value={formData.bankName}
              onChange={(e) =>
                setFormData({ ...formData, bankName: e.target.value })
              }
              placeholder="e.g. Commercial Bank of Ethiopia"
            />
            <Input
              label="Account Number"
              value={formData.accountNumber}
              onChange={(e) =>
                setFormData({ ...formData, accountNumber: e.target.value })
              }
              placeholder="Enter bank account number"
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/owner/employees')}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isEditing ? 'Update Employee' : 'Create Employee'}
          </Button>
        </div>
      </form>
    </div>
  );
}
