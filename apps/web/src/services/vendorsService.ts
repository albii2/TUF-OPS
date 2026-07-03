import { apiClient } from './apiClient';
import { DATA_MODE } from './dataMode';
import { tufVendors } from '../data/vendors';

export type Vendor = typeof tufVendors[number] & { id?: string };

export type VendorAgreement = {
  id: string;
  vendorId: string;
  startDate: string;
  endDate?: string;
  terms: string;
  active: boolean;
};

export type VendorPerformance = {
  id: string;
  vendorId: string;
  orderId: string;
  onTimeDelivery: boolean;
  qualityRating: number; // 1-5
  notes?: string;
  recordedAt: string;
};

export type VendorPayment = {
  id: string;
  vendorId: string;
  orderId: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID';
  dueDate?: string;
  paidDate?: string;
  createdAt: string;
};

// ── Mock mode (uses tufVendors data) ──

let mockVendors: Vendor[] = tufVendors.map((v, i) => ({
  ...v,
  id: `vendor-${i + 1}`,
}));

let mockAgreements: VendorAgreement[] = [];
let mockPerformance: VendorPerformance[] = [];
let mockPayments: VendorPayment[] = [];
let mockAssignments: Record<string, string> = {}; // orderId → vendorId

export function listVendors(): Vendor[] {
  return mockVendors;
}

export function getVendorById(id: string): Vendor | undefined {
  return mockVendors.find((v) => v.id === id);
}

export function createVendor(data: Partial<Vendor>): Vendor {
  const vendor: Vendor = {
    id: `vendor-${Date.now()}`,
    name: data.name ?? 'New Vendor',
    size: data.size ?? 'SMALL',
    whatsapp: data.whatsapp ?? '',
    email: data.email ?? '',
    specialization: data.specialization ?? 'UNIFORMS',
    rank: data.rank ?? 99,
    country: data.country ?? 'PK',
    city: data.city ?? 'Sialkot',
    turnaroundDays: data.turnaroundDays ?? 30,
    minimumOrder: data.minimumOrder ?? 5,
    active: data.active ?? true,
  };
  mockVendors = [...mockVendors, vendor];
  return vendor;
}

export function updateVendor(id: string, patch: Partial<Vendor>): Vendor {
  const idx = mockVendors.findIndex((v) => v.id === id);
  if (idx === -1) throw new Error(`Vendor ${id} not found`);
  mockVendors[idx] = { ...mockVendors[idx], ...patch };
  return mockVendors[idx];
}

export function getAgreements(vendorId: string): VendorAgreement[] {
  return mockAgreements.filter((a) => a.vendorId === vendorId);
}

export function createAgreement(vendorId: string, data: Partial<VendorAgreement>): VendorAgreement {
  const agreement: VendorAgreement = {
    id: `agr-${Date.now()}`,
    vendorId,
    startDate: data.startDate ?? new Date().toISOString().slice(0, 10),
    endDate: data.endDate,
    terms: data.terms ?? 'Standard terms',
    active: true,
  };
  mockAgreements = [...mockAgreements, agreement];
  return agreement;
}

export function getPerformance(vendorId: string): VendorPerformance[] {
  return mockPerformance.filter((p) => p.vendorId === vendorId);
}

export function recordPerformance(vendorId: string, data: Partial<VendorPerformance>): VendorPerformance {
  const record: VendorPerformance = {
    id: `perf-${Date.now()}`,
    vendorId,
    orderId: data.orderId ?? '',
    onTimeDelivery: data.onTimeDelivery ?? true,
    qualityRating: data.qualityRating ?? 4,
    notes: data.notes,
    recordedAt: new Date().toISOString(),
  };
  mockPerformance = [...mockPerformance, record];
  return record;
}

export function getPayments(vendorId: string): VendorPayment[] {
  return mockPayments.filter((p) => p.vendorId === vendorId);
}

export function createPayment(vendorId: string, data: Partial<VendorPayment>): VendorPayment {
  const payment: VendorPayment = {
    id: `pay-${Date.now()}`,
    vendorId,
    orderId: data.orderId ?? '',
    amount: data.amount ?? 0,
    status: 'PENDING',
    dueDate: data.dueDate,
    paidDate: undefined,
    createdAt: new Date().toISOString(),
  };
  mockPayments = [...mockPayments, payment];
  return payment;
}

export function updatePaymentStatus(paymentId: string, status: VendorPayment['status']): VendorPayment {
  const idx = mockPayments.findIndex((p) => p.id === paymentId);
  if (idx === -1) throw new Error(`Payment ${paymentId} not found`);
  mockPayments[idx] = { ...mockPayments[idx], status, paidDate: status === 'PAID' ? new Date().toISOString() : mockPayments[idx].paidDate };
  return mockPayments[idx];
}

export function assignVendorToOrder(orderId: string, vendorId: string): { orderId: string; vendorId: string } {
  mockAssignments[orderId] = vendorId;
  return { orderId, vendorId };
}

export function getVendorAssignment(orderId: string): string | undefined {
  return mockAssignments[orderId];
}

export function getActiveOrdersForVendor(vendorId: string): string[] {
  return Object.entries(mockAssignments)
    .filter(([, vid]) => vid === vendorId)
    .map(([oid]) => oid);
}

export function getVendorsForSpecialization(specialization: string): Vendor[] {
  return mockVendors.filter((v) => v.specialization === specialization);
}

// ── Async API wrappers ──

export async function listVendorsAsync(): Promise<Vendor[]> {
  if (DATA_MODE === 'api') return apiClient<Vendor[]>('/vendors');
  return listVendors();
}

export async function getVendorByIdAsync(id: string): Promise<Vendor> {
  if (DATA_MODE === 'api') return apiClient<Vendor>(`/vendors/${id}`);
  const v = getVendorById(id);
  if (!v) throw new Error(`Vendor ${id} not found`);
  return v;
}

export async function createVendorAsync(data: Partial<Vendor>): Promise<Vendor> {
  if (DATA_MODE === 'api') return apiClient<Vendor>('/vendors', { method: 'POST', body: data });
  return createVendor(data);
}

export async function updateVendorAsync(id: string, patch: Partial<Vendor>): Promise<Vendor> {
  if (DATA_MODE === 'api') return apiClient<Vendor>(`/vendors/${id}`, { method: 'PATCH', body: patch });
  return updateVendor(id, patch);
}

export async function getAgreementsAsync(vendorId: string): Promise<VendorAgreement[]> {
  if (DATA_MODE === 'api') return apiClient<VendorAgreement[]>(`/vendors/${vendorId}/agreements`);
  return getAgreements(vendorId);
}

export async function createAgreementAsync(vendorId: string, data: Partial<VendorAgreement>): Promise<VendorAgreement> {
  if (DATA_MODE === 'api') return apiClient<VendorAgreement>(`/vendors/${vendorId}/agreements`, { method: 'POST', body: data });
  return createAgreement(vendorId, data);
}

export async function getPerformanceAsync(vendorId: string): Promise<VendorPerformance[]> {
  if (DATA_MODE === 'api') return apiClient<VendorPerformance[]>(`/vendors/${vendorId}/performance`);
  return getPerformance(vendorId);
}

export async function recordPerformanceAsync(vendorId: string, data: Partial<VendorPerformance>): Promise<VendorPerformance> {
  if (DATA_MODE === 'api') return apiClient<VendorPerformance>(`/vendors/${vendorId}/performance`, { method: 'POST', body: data });
  return recordPerformance(vendorId, data);
}

export async function getPaymentsAsync(vendorId: string): Promise<VendorPayment[]> {
  if (DATA_MODE === 'api') return apiClient<VendorPayment[]>(`/vendors/${vendorId}/payments`);
  return getPayments(vendorId);
}

export async function createPaymentAsync(vendorId: string, data: Partial<VendorPayment>): Promise<VendorPayment> {
  if (DATA_MODE === 'api') return apiClient<VendorPayment>(`/vendors/${vendorId}/payments`, { method: 'POST', body: data });
  return createPayment(vendorId, data);
}

export async function updatePaymentStatusAsync(paymentId: string, status: VendorPayment['status']): Promise<VendorPayment> {
  if (DATA_MODE === 'api') return apiClient<VendorPayment>(`/vendors/payments/${paymentId}/status`, { method: 'PATCH', body: { status } });
  return updatePaymentStatus(paymentId, status);
}

export async function assignVendorToOrderAsync(orderId: string, vendorId: string): Promise<{ orderId: string; vendorId: string }> {
  if (DATA_MODE === 'api') return apiClient<{ orderId: string; vendorId: string }>(`/orders/${orderId}/assign-vendor`, { method: 'POST', body: { vendorId } });
  return assignVendorToOrder(orderId, vendorId);
}

export async function getVendorAssignmentAsync(orderId: string): Promise<{ vendorId?: string }> {
  if (DATA_MODE === 'api') return apiClient<{ vendorId?: string }>(`/orders/${orderId}/vendor-assignments`);
  const vid = getVendorAssignment(orderId);
  return { vendorId: vid };
}

export async function getActiveOrdersForVendorAsync(vendorId: string): Promise<string[]> {
  if (DATA_MODE === 'api') return apiClient<string[]>(`/vendors/${vendorId}/active-orders`);
  return getActiveOrdersForVendor(vendorId);
}
