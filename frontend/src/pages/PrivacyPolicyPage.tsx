import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidade</h1>
        
        <div className="prose prose-blue max-w-none text-gray-600">
          <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <h3>1. Coleta de Informações</h3>
          <p>
            Coletamos informações que você nos fornece diretamente, como nome, e-mail e dados da sua loja ao criar uma conta. 
            Também coletamos dados de uso automaticamente quando você interage com nossos serviços.
          </p>

          <h3>2. Uso das Informações</h3>
          <p>
            Usamos suas informações para fornecer, manter e melhorar nossos serviços, processar transações, 
            enviar notificações importantes e responder a seus comentários e perguntas.
          </p>

          <h3>3. Compartilhamento de Informações</h3>
          <p>
            Não vendemos seus dados pessoais. Podemos compartilhar informações com prestadores de serviços 
            que nos ajudam a operar nossa plataforma, sempre sob obrigações de confidencialidade.
          </p>

          <h3>4. Segurança de Dados</h3>
          <p>
            Implementamos medidas de segurança razoáveis para proteger suas informações contra acesso, alteração, 
            divulgação ou destruição não autorizada.
          </p>

          <h3>5. Seus Direitos</h3>
          <p>
            Você tem o direito de acessar, corrigir ou excluir suas informações pessoais. Você pode gerenciar 
            suas preferências de comunicação através das configurações da sua conta.
          </p>
          
          <h3>6. Contato</h3>
          <p>
            Para exercer seus direitos de privacidade ou tirar dúvidas, entre em contato pelo e-mail suporte@vitrinerapida.com.
          </p>
        </div>
      </main>
    </div>
  )
}
