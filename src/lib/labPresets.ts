export interface LabTestPreset {
  testName: string
  unit: string
  category: string
}

export const LIPID_PANEL_TESTS: LabTestPreset[] = [
  { testName: 'Total Cholesterol', unit: 'mg/dL', category: 'Lipid panel' },
  { testName: 'LDL', unit: 'mg/dL', category: 'Lipid panel' },
  { testName: 'HDL', unit: 'mg/dL', category: 'Lipid panel' },
  { testName: 'Triglycerides', unit: 'mg/dL', category: 'Lipid panel' },
]

export const CLINICAL_LAB_TESTS: LabTestPreset[] = [
  { testName: 'A1C', unit: '%', category: 'Diabetes' },
  { testName: 'Vitamin D', unit: 'ng/mL', category: 'Vitamins' },
  { testName: 'B12', unit: 'pg/mL', category: 'Vitamins' },
  { testName: 'Iron', unit: 'mcg/dL', category: 'Iron studies' },
  { testName: 'Ferritin', unit: 'ng/mL', category: 'Iron studies' },
  { testName: 'TSH', unit: 'mIU/L', category: 'Thyroid' },
  { testName: 'eGFR', unit: 'mL/min/1.73 m2', category: 'Kidney' },
  { testName: 'CRP', unit: 'mg/L', category: 'Inflammation' },
]

export const LAB_PRESET_GROUPS = [
  { id: 'lipid', label: 'Lipid panel', tests: LIPID_PANEL_TESTS },
  { id: 'clinical', label: 'Clinical labs', tests: CLINICAL_LAB_TESTS },
] as const

export function getLabCategory(testName: string): string {
  const all = [...LIPID_PANEL_TESTS, ...CLINICAL_LAB_TESTS]
  const match = all.find((t) => t.testName.toLowerCase() === testName.toLowerCase())
  return match?.category ?? 'Other'
}
