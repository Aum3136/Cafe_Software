import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export function QrGenerator() {
  const [cafeSlug, setCafeSlug] = useState('chai-corner');
  const [tableId, setTableId] = useState('4');
  const [qrUrl, setQrUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const targetUrl = `${window.location.origin}/menu/${cafeSlug}?table=${encodeURIComponent(tableId)}`;

  useEffect(() => {
    if (!cafeSlug.trim() || !tableId.trim()) {
      setQrUrl('');
      return;
    }

    QRCode.toDataURL(
      targetUrl,
      {
        width: 300,
        margin: 2,
        color: {
          dark: '#1A1410', // ink (our warm near-black)
          light: '#FFFFFF',
        },
      }
    )
      .then((url) => {
        setQrUrl(url);
        setErrorMessage(null);
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage('Failed to generate QR code.');
      });
  }, [cafeSlug, tableId, targetUrl]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-card border border-line p-6 w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-saffron-100 rounded-full flex items-center justify-center mx-auto mb-3 text-saffron-600 text-2xl">
            📱
          </div>
          <h1 className="text-lg font-bold text-ink">QR Code Generator</h1>
          <p className="text-xs text-muted mt-1">
            Generate printable QR codes for tables.
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label htmlFor="cafe-slug" className="block text-xs font-bold text-ink mb-1">
              Cafe Slug
            </label>
            <input
              id="cafe-slug"
              type="text"
              value={cafeSlug}
              onChange={(e) => setCafeSlug(e.target.value)}
              placeholder="e.g. chai-corner"
              className="w-full border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-saffron-500 bg-canvas transition-colors"
            />
          </div>

          <div>
            <label htmlFor="table-id" className="block text-xs font-bold text-ink mb-1">
              Table Identifier
            </label>
            <input
              id="table-id"
              type="text"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              placeholder="e.g. 4, Table A, Counter"
              className="w-full border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-saffron-500 bg-canvas transition-colors"
            />
          </div>
        </div>

        {/* Preview URL */}
        <div className="bg-canvas border border-line rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted font-bold tracking-wide uppercase mb-1">Target URL</p>
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-saffron-600 hover:underline break-all"
          >
            {targetUrl}
          </a>
        </div>

        {/* QR Code Output */}
        <div className="flex flex-col items-center justify-center py-2">
          {errorMessage && (
            <p className="text-xs text-red-500 font-semibold">{errorMessage}</p>
          )}

          {qrUrl ? (
            <div className="relative border-2 border-line rounded-2xl overflow-hidden p-2 bg-white shadow-sm transition-all hover:scale-[1.02] duration-200">
              <img src={qrUrl} alt="Generated QR Code" className="w-48 h-48 object-contain" />
            </div>
          ) : (
            <div className="w-48 h-48 border border-dashed border-ghost rounded-2xl flex items-center justify-center text-ghost text-xs text-center p-4">
              Enter both cafe slug and table number to view QR.
            </div>
          )}
        </div>

        {/* Actions */}
        {qrUrl && (
          <div className="pt-2">
            <a
              href={qrUrl}
              download={`qr-${cafeSlug}-table-${tableId}.png`}
              className="w-full inline-flex items-center justify-center bg-saffron-500 hover:bg-saffron-600 active:scale-95 text-white font-semibold rounded-xl py-3 shadow-md transition-all text-sm gap-2"
            >
              📥 Download PNG
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
