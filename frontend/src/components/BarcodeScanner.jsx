import { useEffect, useRef, useState } from 'react'
import { X, Camera, AlertTriangle, Keyboard } from 'lucide-react'
import { BrowserMultiFormatReader } from '@zxing/browser'

export default function BarcodeScanner({ onScan, onClose, title = 'Scan Barcode' }) {
  const videoRef    = useRef(null)
  const controlsRef = useRef(null)
  const lastScan    = useRef('')
  const [error, setError]       = useState('')
  const [flash, setFlash]       = useState(false)
  const [manual, setManual]     = useState('')
  const [showManual, setShowManual] = useState(false)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()

    async function start() {
      try {
        const devices = await reader.listVideoInputDevices()
        if (!devices.length) { setError('No camera found on this device'); return }
        const device = devices.find(d => /back|environment|rear/i.test(d.label)) || devices[devices.length - 1]
        controlsRef.current = await reader.decodeFromVideoDevice(
          device.deviceId, videoRef.current,
          result => {
            if (!result) return
            const code = result.getText()
            if (code === lastScan.current) return
            lastScan.current = code
            setFlash(true)
            setTimeout(() => setFlash(false), 400)
            onScan(code)
          }
        )
      } catch (e) {
        setError(
          e.name === 'NotAllowedError'
            ? 'Camera access denied — please allow camera in browser settings'
            : 'Could not start camera: ' + e.message
        )
      }
    }

    start()
    return () => { controlsRef.current?.stop?.() }
  }, [])

  function submitManual() {
    const v = manual.trim()
    if (!v) return
    onScan(v)
    setManual('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)' }}>
      <div className="card w-full max-w-sm space-y-3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={15} style={{ color: 'var(--accent)' }} />
            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{title}</span>
          </div>
          <button onClick={onClose}><X size={15} style={{ color: 'var(--text3)' }} /></button>
        </div>

        {error ? (
          <div className="p-5 rounded-xl text-center space-y-3"
            style={{ background: 'rgba(255,71,87,0.07)', border: '1px solid rgba(255,71,87,0.2)' }}>
            <AlertTriangle size={22} style={{ color: 'var(--red)', margin: '0 auto' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--red)' }}>{error}</p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl"
            style={{
              aspectRatio: '4/3', background: '#000',
              border: `2px solid ${flash ? 'var(--accent)' : 'transparent'}`,
              boxShadow: flash ? '0 0 16px rgba(0,212,170,0.4)' : 'none',
              transition: 'border-color 0.1s, box-shadow 0.1s',
            }}>
            <video ref={videoRef} autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* Frame overlay */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {[
                { pos: '12px 0 0 12px', borders: 'borderTop borderLeft' },
                { pos: '12px 12px 0 0', borders: 'borderTop borderRight' },
                { pos: '0 0 12px 12px', borders: 'borderBottom borderLeft' },
                { pos: '0 12px 12px 0', borders: 'borderBottom borderRight' },
              ].map(({ pos }, i) => {
                const [top, right, bottom, left] = pos.split(' ')
                return (
                  <div key={i} style={{
                    position: 'absolute', width: 20, height: 20,
                    top: top !== '0' ? top : undefined,
                    bottom: bottom !== '0' ? bottom : undefined,
                    left: left !== '0' ? left : undefined,
                    right: right !== '0' ? right : undefined,
                    borderColor: 'var(--accent)',
                    borderTopWidth: ['0','1'].includes(String(i)) ? 2 : 0,
                    borderBottomWidth: ['2','3'].includes(String(i)) ? 2 : 0,
                    borderLeftWidth: ['0','2'].includes(String(i)) ? 2 : 0,
                    borderRightWidth: ['1','3'].includes(String(i)) ? 2 : 0,
                    borderStyle: 'solid', borderRadius: 2,
                  }} />
                )
              })}
              {/* Scan line */}
              <div style={{
                position: 'absolute', top: '50%', left: '12%', right: '12%',
                height: 2, transform: 'translateY(-50%)',
                background: flash ? 'var(--accent)' : 'rgba(0,212,170,0.5)',
                boxShadow: flash ? '0 0 10px var(--accent)' : 'none',
                transition: 'all 0.1s',
              }} />
            </div>
          </div>
        )}

        <p className="text-[11px] text-center" style={{ color: 'var(--text3)' }}>
          Point camera at barcode · EAN-13, EAN-8, UPC-A, QR Code
        </p>

        {/* Manual entry toggle */}
        <button
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium"
          style={{ background: 'var(--surface2)', color: 'var(--text3)' }}
          onClick={() => setShowManual(v => !v)}>
          <Keyboard size={12} /> Enter barcode manually
        </button>

        {showManual && (
          <div className="flex gap-2">
            <input className="input text-sm flex-1" value={manual}
              onChange={e => setManual(e.target.value)}
              placeholder="Type or paste barcode…"
              onKeyDown={e => e.key === 'Enter' && submitManual()} autoFocus />
            <button className="btn-primary" onClick={submitManual}>OK</button>
          </div>
        )}
      </div>
    </div>
  )
}
