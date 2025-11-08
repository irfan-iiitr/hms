export type UserRole = "patient" | "doctor" | "admin"

export interface User {
  _id?: string
  id?: string // client-side id used by legacy UI
  email: string
  password?: string
  // UI currently uses a single name field
  name?: string
  fullName?: string
  // For APIs we also support first/last
  firstName?: string
  lastName?: string
  role: UserRole
  phone?: string
  createdAt?: Date | string
  updatedAt?: Date | string
  availableSlots?: TimeSlot[]
}

export interface MedicalFileInfo {
  summary: string
  details: any
  uploadedAt: Date
}

export interface PatientProfile extends User {
  role: "patient"
  dateOfBirth?: Date
  gender?: string
  address?: string
  emergencyContact?: string
  bloodGroup?: string
  medicalHistory?: string[]
  allergies?: string[]
  medicalFilesInformation?: MedicalFileInfo[]
}

export interface DoctorProfile extends User {
  role: "doctor"
  specialization: string
  licenseNumber: string
  yearsOfExperience: number
  hospitalAffiliation?: string
  consultationFee?: number
  availableSlots?: TimeSlot[]
}

export interface TimeSlot {
  day: string
  startTime: string
  endTime: string
}

export interface MedicalRecord {
  _id?: string
  id?: string
  patientId: string
  doctorId: string
  date: Date
  diagnosis: string
  symptoms: string[]
  notes?: string
  attachments?: string[]
}

export interface Appointment {
  _id?: string
  id?: string
  patientId: string
  doctorId: string
  date: Date
  time: string
  status: "scheduled" | "completed" | "cancelled"
  reason?: string
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Prescription {
  _id?: string
  id?: string
  recordId: string
  patientId: string
  doctorId: string
  medications: Medication[]
  notes?: string
  issuedDate: Date
  expiryDate: Date
  createdAt?: Date
}

export interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  token?: string
  user?: User
}
