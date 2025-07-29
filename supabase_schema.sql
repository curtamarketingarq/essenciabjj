-- =====================================================
-- ESSÊNCIA BJJ ACADEMY - SCHEMA SIMPLES
-- =====================================================

-- Tabela única para armazenar os agendamentos de aula experimental
CREATE TABLE trial_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 3 AND age <= 100),
    class_day VARCHAR(20) NOT NULL,
    class_time VARCHAR(50) NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    specific_date VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca por telefone
CREATE INDEX idx_trial_registrations_phone ON trial_registrations(phone);

-- Índice para busca por data de criação
CREATE INDEX idx_trial_registrations_created_at ON trial_registrations(created_at);

-- Habilitar Row Level Security
ALTER TABLE trial_registrations ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção pública (para o formulário)
CREATE POLICY "Allow public insert" ON trial_registrations FOR INSERT WITH CHECK (true);

-- Política para permitir leitura apenas para usuários autenticados (admin)
CREATE POLICY "Allow authenticated read" ON trial_registrations FOR SELECT USING (auth.role() = 'authenticated');

-- Dados de exemplo
INSERT INTO trial_registrations (full_name, phone, age, class_day, class_time, class_name, specific_date) VALUES
('João Silva', '(11) 99999-1234', 8, 'Tuesday', '6:00 PM to 6:50 PM', 'KIDS GI 6 - 9', '15/01 (6pm-6:50pm)'),
('Maria Santos', '(11) 99999-5678', 25, 'Monday', '7:00 PM to 8:30 PM', 'ADULT GI', '14/01 (7pm-8:30pm)');