import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { leaseAPI } from '../../services/api';

interface Props {
  leaseId: string;
  side: 'owner' | 'tenant';
  isOpen: boolean;
  onClose: () => void;
}

export default function SignLeaseDialog({ leaseId, side, isOpen, onClose }: Props) {
  const queryClient = useQueryClient();
  const [accepted, setAccepted] = useState(false);

  const mutation = useMutation({
    mutationFn: () => leaseAPI.sign(leaseId, side),
    onSuccess: () => {
      toast.success('Lease signed successfully');
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to sign lease');
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sign Lease Agreement">
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-yellow-800">Legal Notice</p>
          <p className="text-yellow-700 mt-1">
            By clicking "I Agree & Sign", you are legally binding yourself to the terms of this lease agreement. Your IP
            address, browser information, and the document hash will be recorded as proof of signing.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            I have reviewed the lease agreement PDF and accept all terms and conditions contained within.
          </span>
        </label>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!accepted || mutation.isPending}>
            {mutation.isPending ? 'Signing...' : 'I Agree & Sign'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
