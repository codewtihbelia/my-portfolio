import React, { useEffect, useState } from 'react';
import { 
  X, Download, ExternalLink, FileText, Maximize2, Minimize2, AlertCircle 
} from 'lucide-react';
import { downloadDocument, getDocumentBlobUrl } from '../../services/storageService';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string;
  version?: string;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  fileUrl,
  version
}) => {
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!isOpen || !fileUrl) {
      setBlobUrl('');
      setLoadError(false);
      return;
    }

    setLoadError(false);
    try {
      const url = getDocumentBlobUrl(fileUrl);
      setBlobUrl(url);

      return () => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      };
    } catch (e) {
      console.error('Failed to create preview blob for PDF:', e);
      setLoadError(true);
    }
  }, [isOpen, fileUrl]);

  if (!isOpen || !fileUrl) return null;

  const handleDownload = () => {
    downloadDocument(fileUrl, title || 'Resume.pdf');
  };

  const handleOpenNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
    } else {
      downloadDocument(fileUrl, title || 'Resume.pdf');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className={`bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen 
            ? 'w-full h-full max-w-none rounded-none' 
            : 'w-full max-w-5xl h-[88vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/80 text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-zinc-100 truncate max-w-xs sm:max-w-md">
                {title || 'Document Preview'}
              </div>
              {version && (
                <div className="text-[11px] text-zinc-400 font-mono">
                  Version: {version}
                </div>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Open in new window"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors hidden sm:inline-flex cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-1 cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / PDF Canvas */}
        <div className="flex-1 bg-zinc-950 p-2 sm:p-4 overflow-hidden flex flex-col items-center justify-center">
          {loadError ? (
            <div className="text-center p-8 space-y-4 max-w-md">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-zinc-200 text-sm">Unable to render PDF inline</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your browser or iframe sandbox does not permit inline embedding of this document. You can download the PDF or open it directly in a new tab.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-200 text-xs font-semibold inline-flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Full Screen</span>
                </button>
              </div>
            </div>
          ) : blobUrl ? (
            <iframe
              src={`${blobUrl}#toolbar=1&navpanes=0`}
              className="w-full h-full rounded-2xl border border-zinc-800 bg-white"
              title={title || 'PDF Document Viewer'}
            />
          ) : (
            <div className="text-xs text-zinc-400">Loading document...</div>
          )}
        </div>
      </div>
    </div>
  );
};
