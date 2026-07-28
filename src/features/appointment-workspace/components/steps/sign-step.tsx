'use client'

import { useState, useRef } from 'react'
import { Pen, Type, Check, AlertCircle, FileSignature } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Signature } from '../../lib/types'

interface SignStepProps {
  signatures: Signature[]
  onSubmitSignature: (data: {
    documentType: string
    signerName: string
    method: 'TYPED' | 'DRAWN'
    signatureText?: string
    signatureImageUrl?: string
    consentAccepted: boolean
  }) => Promise<void>
  onComplete: () => void
  isLoading?: boolean
  error?: string | null
}

const DOCUMENTS_TO_SIGN = [
  { type: 'vizionare_sign', label: 'Fișă de Vizionare' },
  { type: 'brokerage_contract', label: 'Contract de Intermediere' },
  { type: 'privacy_consent', label: 'Consimțământ Prelucrare Date' },
]

export function SignStep({
  signatures,
  onSubmitSignature,
  onComplete,
  isLoading,
  error,
}: SignStepProps) {
  const [activeDoc, setActiveDoc] = useState<string | null>(null)
  const [signerName, setSignerName] = useState('')
  const [method, setMethod] = useState<'TYPED' | 'DRAWN'>('TYPED')
  const [typedSignature, setTypedSignature] = useState('')
  const [consentAccepted, setConsentAccepted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const signedDocTypes = signatures.map(s => s.document_type)
  const allSigned = DOCUMENTS_TO_SIGN.every(d => signedDocTypes.includes(d.type))

  const handleSubmit = async (docType: string) => {
    if (!signerName || !consentAccepted) return

    const signatureData: Parameters<typeof onSubmitSignature>[0] = {
      documentType: docType,
      signerName,
      method,
      consentAccepted,
    }

    if (method === 'TYPED') {
      signatureData.signatureText = typedSignature
    } else {
      // Get canvas data URL
      const canvas = canvasRef.current
      if (canvas) {
        signatureData.signatureImageUrl = canvas.toDataURL('image/png')
      }
    }

    await onSubmitSignature(signatureData)
    setActiveDoc(null)
    setTypedSignature('')
    setConsentAccepted(false)
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Semnează Documentele
        </h2>
        <p className="text-muted-foreground">
          Semnați electronic documentele necesare.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Document List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Documente de Semnat</h3>
        {DOCUMENTS_TO_SIGN.map((doc) => {
          const isSigned = signedDocTypes.includes(doc.type)
          const isActive = activeDoc === doc.type

          return (
            <Card
              key={doc.type}
              className={`
                cursor-pointer transition-all
                ${isSigned ? 'border-emerald-500/50 bg-emerald-500/5' : ''}
                ${isActive ? 'border-primary ring-2 ring-primary/20' : ''}
              `}
              onClick={() => !isSigned && setActiveDoc(isActive ? null : doc.type)}
            >
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  {isSigned ? (
                    <Check className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <FileSignature className="h-6 w-6 text-primary" />
                  )}
                  <div>
                    <p className="font-medium">{doc.label}</p>
                    {isSigned && (
                      <p className="text-sm text-emerald-600">
                        Semnat de {signatures.find(s => s.document_type === doc.type)?.signer_name}
                      </p>
                    )}
                  </div>
                </div>
                {isSigned ? (
                  <span className="text-sm font-medium text-emerald-600">Semnat</span>
                ) : isActive ? (
                  <span className="text-sm text-muted-foreground">Închis</span>
                ) : (
                  <span className="text-sm text-primary">Semnare</span>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Signature Form */}
      {activeDoc && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg">
              {DOCUMENTS_TO_SIGN.find(d => d.type === activeDoc)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Signer Name */}
            <div className="space-y-2">
              <Label htmlFor="signerName">Nume semnatar *</Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Introduceți numele complet pentru semnare"
                disabled={isLoading}
              />
            </div>

            {/* Signature Method */}
            <div className="space-y-3">
              <Label>Metodă de semnare</Label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setMethod('TYPED')}
                  className={`
                    flex-1 p-4 rounded-lg border-2 transition-all
                    ${method === 'TYPED'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                    }
                  `}
                >
                  <Type className="h-6 w-6 mx-auto mb-2" />
                  <p className="font-medium">Semnare Tipărită</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Scrieți numele cu caractere de tipar
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('DRAWN')}
                  className={`
                    flex-1 p-4 rounded-lg border-2 transition-all
                    ${method === 'DRAWN'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                    }
                  `}
                >
                  <Pen className="h-6 w-6 mx-auto mb-2" />
                  <p className="font-medium">Semnare Desenată</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Desenați semnătura cu mouse-ul
                  </p>
                </button>
              </div>
            </div>

            {/* Signature Input */}
            {method === 'TYPED' ? (
              <div className="space-y-2">
                <Label htmlFor="typedSignature">Semnătura dumneavoastră</Label>
                <Input
                  id="typedSignature"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value.toUpperCase())}
                  placeholder="MARIA IONESCU"
                  className="text-xl tracking-widest font-serif"
                  disabled={isLoading}
                />
                {typedSignature && (
                  <p className="text-2xl font-serif tracking-widest text-center py-4 bg-muted/50 rounded">
                    {typedSignature}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Desenați semnătura</Label>
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={150}
                    className="w-full bg-white border-2 border-dashed border-border rounded-lg cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={clearCanvas}
                  >
                    Șterge
                  </Button>
                </div>
              </div>
            )}

            {/* Consent */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground">
                  Prin semnarea acestui document, confirm că am citit și accept{' '}
                  <a href="/termeni" className="text-primary hover:underline" target="_blank">
                    Termenii și Condițiile
                  </a>{' '}
                  și{' '}
                  <a href="/confidentialitate" className="text-primary hover:underline" target="_blank">
                    Politica de Confidențialitate
                  </a>
                  .
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setActiveDoc(null)}
                disabled={isLoading}
              >
                Anulează
              </Button>
              <Button
                onClick={() => handleSubmit(activeDoc)}
                disabled={!signerName || !consentAccepted || (method === 'TYPED' && !typedSignature) || isLoading}
              >
                Semnează
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          onClick={onComplete}
          disabled={!allSigned || isLoading}
          className="min-w-[200px]"
        >
          {isLoading ? 'Se procesează...' : 'Finalizează'}
        </Button>
      </div>
    </div>
  )
}
