import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'

export default function CookiesPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Cookies</h1>
        
        <div className="prose prose-blue max-w-none text-gray-600">
          <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <h3>1. O que são Cookies?</h3>
          <p>
            Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita um site. 
            Eles são amplamente utilizados para fazer os sites funcionarem ou funcionarem de forma mais eficiente.
          </p>

          <h3>2. Como usamos Cookies</h3>
          <p>
            Utilizamos cookies para:
          </p>
          <ul>
            <li>Manter você conectado à sua conta.</li>
            <li>Lembrar suas preferências e configurações.</li>
            <li>Analisar como nosso serviço é usado para melhorá-lo.</li>
            <li>Garantir a segurança da plataforma.</li>
          </ul>

          <h3>3. Tipos de Cookies</h3>
          <p>
            <strong>Cookies Essenciais:</strong> Necessários para o funcionamento do site. Sem eles, o site não funciona corretamente.<br/>
            <strong>Cookies de Desempenho:</strong> Coletam informações anônimas sobre como os visitantes usam o site.<br/>
            <strong>Cookies Funcionais:</strong> Lembram escolhas que você faz (como seu nome de usuário ou idioma).
          </p>

          <h3>4. Gerenciamento de Cookies</h3>
          <p>
            A maioria dos navegadores permite que você recuse ou aceite cookies. Você pode alterar as configurações 
            do seu navegador para bloquear cookies ou alertá-lo quando cookies estiverem sendo enviados.
          </p>
          
          <h3>5. Contato</h3>
          <p>
            Se tiver dúvidas sobre nossa Política de Cookies, entre em contato pelo e-mail suporte@vitrinerapida.com.
          </p>
        </div>
      </main>
    </div>
  )
}
