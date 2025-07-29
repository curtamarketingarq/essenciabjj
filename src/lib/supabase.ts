import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipo para os dados do formulário
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
  const { data: result, error } = await supabase
    .from('trial_registrations')
    .insert([data])
    .select()
    .single()

  if (error) {
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