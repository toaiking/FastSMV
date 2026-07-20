/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoefficientLibrary } from './types';

export const defaultLibrary: CoefficientLibrary = {
  version: 1,
  updatedAt: new Date().toISOString(),
  coefficients: [
    // 1. Loại sản phẩm (Product Type)
    { id: 'prod-tshirt', category: 'product_type', name: 'Áo thun', value: 0.9, description: 'Sản phẩm dệt kim đơn giản' },
    { id: 'prod-shirt', category: 'product_type', name: 'Sơ mi', value: 1.1, description: 'Sơ mi nam/nữ có cổ' },
    { id: 'prod-jeans', category: 'product_type', name: 'Quần jeans', value: 1.3, description: 'Quần denim dày, nhiều chi tiết túi' },
    { id: 'prod-jacket', category: 'product_type', name: 'Áo khoác', value: 1.5, description: 'Áo khoác gió hoặc 2 lớp phức tạp' },
    { id: 'prod-kids', category: 'product_type', name: 'Đồ trẻ em', value: 0.85, description: 'Kích thước nhỏ, dễ may' },
    { id: 'prod-dress', category: 'product_type', name: 'Váy/Đầm', value: 1.25, description: 'Thời trang nữ phức tạp' },

    // 2. Độ phức tạp (Complexity)
    { id: 'comp-easy', category: 'complexity', name: 'Dễ (Easy)', value: 0.8, description: 'Đường may thẳng, ít ráp nối' },
    { id: 'comp-normal', category: 'complexity', name: 'Bình thường (Normal)', value: 1.0, description: 'Độ phức tạp trung bình tiêu chuẩn' },
    { id: 'comp-hard', category: 'complexity', name: 'Khó (Hard)', value: 1.2, description: 'Nhiều đường cong, chi tiết nhỏ' },
    { id: 'comp-veryhard', category: 'complexity', name: 'Rất khó (Very Hard)', value: 1.4, description: 'Chất liệu khó may, đòi hỏi kỹ thuật cao' },

    // 3. Kinh nghiệm cá nhân (Personal Experience / Estimator Factor)
    { id: 'exp-expert', category: 'experience', name: 'Kinh nghiệm cao (Expert)', value: 0.9, description: 'Người may thạo nghề lâu năm' },
    { id: 'exp-normal', category: 'experience', name: 'Kinh nghiệm thường (Standard)', value: 1.0, description: 'Công nhân may bình thường' },
    { id: 'exp-beginner', category: 'experience', name: 'Công nhân mới (Beginner)', value: 1.2, description: 'Học việc, năng suất thấp hơn' },

    // 4. Bù hao (Allowance) - stored as % multiplier, e.g. 0.10 for 10%
    { id: 'allow-standard', category: 'allowance', name: 'Tiêu chuẩn (Standard)', value: 0.10, description: 'Bù hao hao phí thông thường 10%' },
    { id: 'allow-low', category: 'allowance', name: 'Thấp (Min)', value: 0.05, description: 'Môi trường làm việc tối ưu 5%' },
    { id: 'allow-high', category: 'allowance', name: 'Cao (Max)', value: 0.15, description: 'Đơn hàng phức tạp nhiều rủi ro 15%' },
    { id: 'allow-veryhigh', category: 'allowance', name: 'Rất cao (Extreme)', value: 0.20, description: 'Mẫu đầu chuyền, hàng dệt khó 20%' }
  ],
  perimeterTiers: [
    { id: 'tier-very-small', minCm: 0, maxCm: 600, multiplier: 0.80, description: 'Rất nhỏ (0-600 cm)' },
    { id: 'tier-small', minCm: 601, maxCm: 1000, multiplier: 0.90, description: 'Nhỏ (601-1000 cm)' },
    { id: 'tier-medium-low', minCm: 1001, maxCm: 1500, multiplier: 0.97, description: 'Trung bình thấp (1001-1500 cm)' },
    { id: 'tier-medium', minCm: 1501, maxCm: 2000, multiplier: 1.00, description: 'Trung bình (baseline) (1501-2000 cm)' },
    { id: 'tier-medium-high', minCm: 2001, maxCm: 2600, multiplier: 1.08, description: 'Trung bình cao (2001-2600 cm)' },
    { id: 'tier-large', minCm: 2601, maxCm: 3400, multiplier: 1.18, description: 'Lớn (2601-3400 cm)' },
    { id: 'tier-very-large', minCm: 3401, maxCm: 4500, multiplier: 1.32, description: 'Rất lớn (3401-4500 cm)' },
    { id: 'tier-extreme', minCm: 4501, maxCm: 999999, multiplier: 1.50, description: 'Cực lớn (>4500 cm)' }
  ]
};
