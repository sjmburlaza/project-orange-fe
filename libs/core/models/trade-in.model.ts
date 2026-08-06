export interface TradeInConfig {
  stepsHeader: TradeInStepHeader[];
  stepOneDescription: TradeInStepOneDescription;
  footerText: string;
}

export interface TradeInStepHeader {
  label: string;
  title: string;
  subtext?: string | null;
}

export interface TradeInStepOneDescription {
  title: string;
  content?: unknown;
  note: string;
}

export interface TradeInSession {
  sessionId: string;
  currentStep: number;
  stepOne?: TradeInStepOneField[] | null;
  formData?: TradeInFormData | null;
  summary?: TradeInStepOneSummary | null;
  stepTwo?: TradeInStepTwo | null;
  stepThree?: TradeInStepThreeField[] | null;
  stepFour?: TradeInStepFour | null;
  isConfirmed: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface CreateTradeInSessionRequest {
  cartCode?: string | null;
  productId?: number | null;
}

export interface UpdateTradeInStepOneRequest {
  stepOne?: TradeInStepOneField[] | null;
  formData?: TradeInFormData | null;
  summary?: TradeInStepOneSummary | null;
}

export interface UpdateTradeInStepTwoRequest {
  stepTwo?: TradeInStepTwo | null;
}

export interface UpdateTradeInStepThreeRequest {
  stepThree?: TradeInStepThreeField[] | null;
}

export interface TradeInFormData {
  postalCode: string;
  category: string;
  brand: string;
  device: string;
  storage: string;
}

export interface TradeInStepOneSummary {
  brand: string;
  device: string;
  storage: string;
  finalAmount: number;
}

export interface TradeInStepOneField {
  title: string;
  fieldName: string;
  placeholder: string;
  value: string;
  options?: unknown;
}

export interface TradeInStepTwo {
  text1: string;
  icon: string;
  iconText: string;
  text2: string;
  imei: TradeInImeiField;
}

export interface TradeInImeiField {
  label: string;
  placeholder: string;
  value: string;
}

export interface TradeInStepThreeField {
  code: string;
  question: string;
  info: string;
  response: string;
}

export interface TradeInStepFour {
  boxHeader: string;
  boxSubtext: string;
  disclaimer: string;
  tncHeader: string;
  tncText1: string;
  tncText2: string;
}

export interface TradeInCategory {
  category: string;
  code: string;
  name: string;
}

export interface TradeInBrand {
  brandName: string;
  code: string;
  amount: number;
  categoryCode: string;
  name: string;
}

export interface TradeInDevice {
  deviceName: string;
  brandName: string;
  code: string;
  amount: number;
  categoryCode: string;
  name: string;
}

export interface TradeInStorage {
  size: string;
  code: string;
  amount: number;
  deviceCode: string;
  name: string;
}
