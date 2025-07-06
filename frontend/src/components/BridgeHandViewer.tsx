import { useEffect, useRef } from 'react'

interface BridgeHandViewerProps {
  pbnFileUrl: string
  className?: string
  onBoardChange?: (boardNumber: number) => void
}

export default function BridgeHandViewer({ 
  pbnFileUrl, 
  className = '',
  onBoardChange
}: BridgeHandViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  useEffect(() => {
    // Listen for board change messages from BSOL
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'boardChange' && data.boardNumber && onBoardChange) {
          onBoardChange(parseInt(data.boardNumber));
        }
      } catch (error) {
        // Not a JSON message, ignore
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onBoardChange])
  
  // Generate the iframe URL directly to ddummy.htm with PBN file parameter
  const iframeUrl = `${import.meta.env.VITE_VIEWER_URL || 'http://localhost:3002'}/bsol/ddummy.htm?file=${encodeURIComponent(pbnFileUrl)}`
  
  return (
    <div className={`bridge-hand-viewer ${className}`}>
      <div className="bg-white overflow-hidden">
        <div className="relative">
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            width="100%"
            height="400"
            frameBorder="0"
            className="border-0 block min-w-full"
            title={`Bridge Tournament: ${pbnFileUrl}`}
            sandbox="allow-scripts allow-same-origin"
            style={{ minHeight: '330px' }}
          />
        </div>
      </div>
    </div>
  )
}