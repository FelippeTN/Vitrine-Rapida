import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'

export default function TermsOfUsePage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Termos de Uso</h1>
        
        <div className="prose prose-green max-w-none text-gray-600">
          <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <h3>1. Aceitação dos Termos</h3>
          <p>
            Ao acessar e usar a plataforma Vitrine Rápida, você aceita e concorda em cumprir estes Termos de Uso. 
            Se você não concordar com qualquer parte destes termos, você não deve usar nossos serviços.
          </p>

          <h3>2. Descrição do Serviço</h3>
          <p>
            A Vitrine Rápida fornece uma plataforma online que permite aos usuários criar catálogos de produtos digitais 
            e compartilhá-los via links. Nós não processamos pagamentos e não somos responsáveis pela entrega dos produtos.
          </p>

          <h3>3. Conta do Usuário</h3>
          <p>
            Para usar certos recursos, você precisará criar uma conta. Você é responsável por manter a confidencialidade 
            de suas credenciais e por todas as atividades que ocorrem sob sua conta.
          </p>

          <h3>4. Uso Aceitável</h3>
          <p>
            Você concorda em não usar o serviço para qualquer finalidade ilegal ou proibida por estes termos. 
            É proibido publicar conteúdo ofensivo, fraudulento ou que viole direitos de terceiros.
          </p>

          <h3>5. Alterações nos Termos</h3>
          <p>
            Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor 
            imediatamente após a publicação na plataforma. Seu uso continuado do serviço constitui aceitação dos novos termos.
          </p>
          
          <h3>6. Contato</h3>
          <p>
            Se tiver dúvidas sobre estes Termos de Uso, entre em contato conosco pelo e-mail vitrinerapida.suporte@gmail.com.
          </p>
        </div>
      </main>
    </div>
  )
}
