export interface CheckoutFormConfig {
  version: string;
  steps: CheckoutStep[];
}

export interface CheckoutStep {
  id: string;
  label: string;
  fields?: DynamicField[];
}

export interface DynamicField {
  type: FieldType;
  name: string;
  label?: string;
  value?: string;
  placeholder?: string;

  options?: Option[];
  optionsApi?: string;
  dependsOn?: string;

  defaultValue?: DynamicFormValue;
  disabled?: boolean;

  visibleIf?: {
    field: string;
    value: DynamicFormValue;
  };

  validators?: FieldValidator[];
  asyncValidators?: FieldValidator[];
  updateOn?: 'change' | 'blur' | 'submit';
  fields?: DynamicField[];

  grid?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export interface FieldValidator {
  name: string;
  value?: string | number | boolean;
}

export interface Option {
  label: string;
  value: string;
  price?: number;
  icon?: string;
}

export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'password'
  | 'select'
  | 'select-search'
  | 'checkbox'
  | 'textarea'
  | 'array'
  | 'group';

export type DynamicFormPrimitive = string | number | boolean | null;

export type DynamicFormValue =
  | DynamicFormPrimitive
  | DynamicFormObject
  | DynamicFormArray;

export interface DynamicFormObject {
  [key: string]: DynamicFormValue;
}

export type DynamicFormArray = DynamicFormValue[];
