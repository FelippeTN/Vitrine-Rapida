import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Modal, Button, Input } from '@/components/ui'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  title: string
}

export function ShareModal({ isOpen, onClose, url, title }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Compartilhe este link com seus clientes"
    >
      <div className="flex gap-2 mt-4 items-end">
        <div className="flex-1">
            <Input 
                readOnly 
                value={url} 
                className="bg-gray-50 text-gray-500"
            />
        </div>
        <Button onClick={handleCopy} className="mb-[2px] h-[42px]">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </Modal>
  )
}
