export interface IPurchase {
  _id: string;
  clientId: string;
  trainerId: string;
  planId: string;
  planName: string;
  amountINR: number;
  platformCommissionINR: number;
  trainerEarningsINR: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  createdAt: string;
}
