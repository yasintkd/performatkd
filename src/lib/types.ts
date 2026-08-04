export type Role = 'coach' | 'assistant'

// yc veritabanından gelen grup/öğrenci tipleri
export interface Group {
  id: string
  name: string
  is_active: boolean
}

export interface Student {
  id: string
  first_name: string
  training_group_id: string
  is_active: boolean
}

export interface TestType {
  id: string
  name: string
  unit: string
  higher_is_better: boolean
  created_by: string
  created_at: string
}

export interface TestSession {
  id: string
  name: string
  session_date: string
  group_id: string // yc training_groups.id
  notes: string | null
  created_by: string
  created_at: string
}

export interface TestResult {
  id: string
  session_id: string
  student_id: string // yc athletes.id
  test_type_id: string
  value: number
  created_by: string
  created_at: string
}

export interface TestResultInput {
  student_id: string
  test_type_id: string
  value: number
}

export interface SessionWithGroup extends TestSession {
  group: Group
}

export interface SessionResult extends TestResult {
  student: Student
  test_type: TestType
}

export interface StudentResult extends TestResult {
  session: Pick<TestSession, 'id' | 'name' | 'session_date'>
  test_type: TestType
}