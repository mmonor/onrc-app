'use client';

import { useState, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [polling, setPolling] = useState(false);
  const intervalRef = useRef(null);

  function handleFileChange(e) {
    setFile(e.target.files[0]);
    setStatus(null);
  }

  function stopPolling() {
    clearInterval(intervalRef.current);
    setPolling(false);
  }

  function startPolling() {
    setPolling(true);
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/import/status`);
        const data = await res.json();
        setStatus(data);
        if (!data.running) stopPolling();
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);
  }

  async function handleUpload() {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_URL}/import/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }
      const data = await res.json();
      setStatus(data.status);
      startPolling();
    } catch (err) {
      setStatus({ message: `error: ${err.message}` });
    } finally {
      setUploading(false);
    }
  }

  async function handleCancel() {
    // Oprim polling-ul imediat ca UI-ul să nu mai arate "în progres".
    stopPolling();
    setStatus(prev => ({ ...prev, message: 'cancelling' }));

    try {
      await fetch(`${API_URL}/import/cancel`, { method: 'POST' });
    } catch (err) {
      console.error('Cancel error:', err);
    }

    // Așteptăm 1.5s ca backend-ul să termine batch-ul curent,
    // apoi facem un poll final ca să afișăm statusul real.
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/import/status`);
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        console.error('Final poll error:', err);
      }
    }, 1500);
  }

  const isDone = status?.message === 'done';
  const isCancelled = status?.message === 'cancelled';
  const isCancelling = status?.message === 'cancelling';
  const isError = status?.message?.startsWith('error');

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Import date ONRC</h1>
      <p className="text-sm text-gray-500 mb-6">
        Selectează un fișier CSV descărcat de pe data.gov.ro
      </p>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
        >
          Alege fișier CSV
        </label>
        {file && (
          <p className="mt-2 text-sm text-gray-600">
            {file.name} — {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={!file || uploading || polling}
          className="flex-1 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? 'Se încarcă...' : polling ? 'Import în progres...' : 'Începe importul'}
        </button>

        {polling && (
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
          >
            Anulează
          </button>
        )}
      </div>

      {status && (
        <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <h2 className="font-medium mb-3">Status import</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`font-medium ${
                isDone ? 'text-green-600' :
                isCancelled ? 'text-yellow-600' :
                isCancelling ? 'text-orange-500' :
                isError ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {isDone ? '✓ Terminat' :
                 isCancelled ? '⊘ Anulat' :
                 isCancelling ? '⟳ Se anulează...' :
                 isError ? '✗ Eroare' :
                 '⟳ În progres'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Rânduri procesate</span>
              <span className="font-medium">
                {status.processed?.toLocaleString('ro-RO') || 0}
              </span>
            </div>

            {status.errors > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Erori</span>
                <span className="font-medium text-red-600">{status.errors}</span>
              </div>
            )}

            {status.startedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Început la</span>
                <span>{new Date(status.startedAt).toLocaleTimeString('ro-RO')}</span>
              </div>
            )}

            {status.finishedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">
                  {isCancelled ? 'Anulat la' : 'Terminat la'}
                </span>
                <span>{new Date(status.finishedAt).toLocaleTimeString('ro-RO')}</span>
              </div>
            )}
          </div>

          {(status.running || isCancelling) && (
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full animate-pulse w-full ${
                isCancelling ? 'bg-orange-400' : 'bg-blue-500'
              }`} />
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-center">
        <a href="/" className="text-sm text-blue-600 hover:underline">
          ← Înapoi la lista de firme
        </a>
      </div>
    </main>
  );
}