// Garante que variáveis de ambiente não quebrem a inicialização dos módulos
process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
process.env.EVOLUTION_API_URL = 'http://localhost:8080'
process.env.EVOLUTION_API_KEY = 'test-evo-key'

// Aumenta o timeout global — testes de agente têm delays reais de digitação
jest.setTimeout(15000)
