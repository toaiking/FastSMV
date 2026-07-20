/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CoefficientCategory = 'product_type' | 'complexity' | 'experience' | 'allowance';

export interface Coefficient {
  id: string;
  category: CoefficientCategory;
  name: string;
  value: number; // e.g., 1.2 or 0.15 (for 15% allowance)
  description?: string;
  isDefault?: boolean;
}

export interface PartTier {
  id: string;
  minParts: number;
  maxParts: number; // Use Infinity or a large number for upper bound
  multiplier: number;
  description: string;
}

export interface CoefficientLibrary {
  version: number;
  updatedAt: string;
  coefficients: Coefficient[];
  partTiers: PartTier[];
}

export interface CoefficientHistory {
  id: string;
  timestamp: string;
  versionBefore: number;
  versionAfter: number;
  action: string; // e.g. "Cập nhật hệ số", "Thêm hệ số"
  details: string; // Chi tiết thay đổi
}

export interface SMVCalculationDetails {
  libraryVersion: number;
  baseSmv: number;
  productTypeVal: number;
  productTypeName: string;
  complexityVal: number;
  complexityName: string;
  partTierVal: number;
  partTierName: string;
  experienceVal: number;
  experienceName: string;
  allowanceVal: number; // e.g., 0.10 for 10%
  allowanceName: string;
  finalSmv: number;
}

export interface Style {
  id: string;
  styleCode: string; // Mã hàng
  styleName: string; // Tên Style
  customer: string; // Khách hàng
  partsCount: number; // Số chi tiết
  baseSmvMethod: 'manual' | 'auto';
  partsSmvRate: number; // Phút/chi tiết (mặc định 0.35 nếu auto)
  baseSmv: number; // Base SMV (nhập tay hoặc tính tự động)
  productTypeId: string; // ID hệ số loại sản phẩm
  complexityId: string; // ID hệ số độ phức tạp
  experienceId: string; // ID hệ số kinh nghiệm cá nhân
  allowanceId: string; // ID hệ số allowance
  estimator: string; // Người ước lượng
  notes?: string;
  patternImage?: string; // Base64 image of pattern from camera or simulated templates
  createdAt: string;
  updatedAt: string;
  calculationDetails: SMVCalculationDetails;
}
