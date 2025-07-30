import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipo para os dados do formulário - estrutura completa da tabela
export interface TrialRegistration {
  id?: string
  full_name: string
  phone: string
  age: number
  class_day: string
  class_time: string
  class_name: string
  specific_date: string
  status?: string
  created_at?: string
}

// Função para criar um novo agendamento
export async function createTrialRegistration(data: Omit<TrialRegistration, 'id' | 'created_at' | 'status'>) {
  // Adicionar a data atual explicitamente para garantir que não seja NULL
  const registrationData = {
    ...data,
    created_at: new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
  }

  const { data: result, error } = await supabase
    .from('trial_registrations')
    .insert([registrationData])
    .select()
    .single()

  if (error) {
    console.error('Supabase error:', error)
    throw error
  }

  return result
}

// Função para buscar todos os agendamentos (para admin)
export async function getTrialRegistrations() {
  const { data, error } = await supabase
    .from('trial_registrations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

// Função para atualizar o status de um agendamento
export async function updateTrialRegistrationStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('trial_registrations')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

// Função para autenticação simples (hardcoded)
export async function authenticateUser(email: string, password: string): Promise<boolean> {
  const validEmail = 'essenciajiujitsuacademy@gmail.com'
  const validPassword = 'Brazil92!'
  
  return email === validEmail && password === validPassword
}