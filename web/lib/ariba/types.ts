export interface PurchaseOrder {
  poNumber: string;
  supplierAnid: string;
  supplierName: string;
  buyerAnid: string;
  buyerName: string;
  totalAmount: number;
  currency: string;
  orderDate: string;
  status: "pending" | "testing" | "active" | "error";
  readinessScore: number;
  itemCount: number;
  format: "cXML" | "EDI-X12";
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  items: number;
  size: number;
  status: "generated" | "pending";
}

export interface OnboardingChecklist {
  step: number;
  title: string;
  owner: "SI" | "SIFL" | "NDL" | "Supplier";
  status: "complete" | "in-progress" | "pending" | "blocked";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  fieldCount: number;
  documentType: string;
}

export interface ValidationError {
  code: string;
  message: string;
  path: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  path: string;
}
