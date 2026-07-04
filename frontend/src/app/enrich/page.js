'use client';

import { useState, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function StatusBox({ status, polling }) {
  if (!status) return null;
  const isDone = status.message === 'done';
  const isCancelled = status.message === 'cancelled';
  const isError = status.message?.startsWith('error');

  return (
    <div className="mt-4 p-3 rounded-md bg-gray-50 border border-gray-200 text-sm space-y-1">
      <div className="flex justify-between">
        <span className="text-gray-500">Status</span>
        <span className={`font-medium ${
          isDone ? 'text-green-600' :
          isCancelled ? 'text-yellow-600' :
          isError ? 'text-red-600' : 'text-blue-600'
        }`}>
          {isDone ? '✓ Terminat' :
           isCancelled ? '⊘ Anulat' :
           isError ? '✗ Eroare' : '⟳ În progres'}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Procesate</span>
        <span className="font-medium">{status.processed?.toLocaleString('ro-RO') || 0}</span>
      </div>
      {status.running && (
        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse w-full" />
        </div>
      )}
    </div>
  );
}

function FileInput({ label, file, onChange, accept = '.csv' }) {
  return (
    <label className="flex cursor-pointer border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
      <input type="file" accept={accept} className="hidden" onChange={e => onChange(e.target.files[0])} />
      {file ? file.name : label}
    </label>
  );
}

export default function EnrichPage() {
  const [stareFile, setStareFile] = useState(null);
  const [stareNomenclator, setStareNomenclator] = useState(null);
  const [stareStatus, setStareStatus] = useState(null);
  const [starePolling, setStarePolling] = useState(false);
  const stareRef = useRef(null);

  const [caenFile, setCaenFile] = useState(null);
  const [caenNomenclator, setCaenNomenclator] = useState(null);
  const [caenStatus, setCaenStatus] = useState(null);
  const [caenPolling, setCaenPolling] = useState(false);
  const caenRef = useRef(null);

  function startPolling(endpoint, setStatus, setPolling, ref) {
    setPolling(true);
    ref.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/enrich/${endpoint}/status`);
        const data = await res.json();
        setStatus(data);
        if (!data.running) { clearInterval(ref.current); setPolling(false); }
      } catch (err) { console.error(err); }
    }, 2000);
  }

  async function handleStareUpload() {
    if (!stareFile || !stareNomenclator) return;
    const formData = new FormData();
    formData.append('stare', stareFile);
    formData.append('nomenclator', stareNomenclator);
    try {
      const res = await fetch(`${API_URL}/enrich/stare`, { method: 'POST', body: formData });
      const data = await res.json();
      setStareStatus(data.status);
      startPolling('stare', setStareStatus, setStarePolling, stareRef);
    } catch (err) {
      setStareStatus({ message: `error: ${err.message}` });
    }
  }

  async function handleStareCancel() {
    clearInterval(stareRef.current);
    setStarePolling(false);
    await fetch(`${API_URL}/enrich/stare/cancel`, { method: 'POST' });
    const res = await fetch(`${API_URL}/enrich/stare/status`);
    setStareStatus(await res.json());
  }

  async function handleCaenUpload() {
    if (!caenFile || !caenNomenclator) return;
    const formData = new FormData();
    formData.append('caen', caenFile);
    formData.append('nomenclator', caenNomenclator);
    try {
      const res = await fetch(`${API_URL}/enrich/caen`, { method: 'POST', body: formData });
      const data = await res.json();
      setCaenStatus(data.status);
      startPolling('caen', setCaenStatus, setCaenPolling, caenRef);
    } catch (err) {
      setCaenStatus({ message: `error: ${err.message}` });
    }
  }

  async function handleCaenCancel() {
    clearInterval(caenRef.current);
    setCaenPolling(false);
    await fetch(`${API_URL}/enrich/caen/cancel`, { method: 'POST' });
    const res = await fetch(`${API_URL}/enrich/caen/status`);
    setCaenStatus(await res.json());
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Îmbogățire date firme</h1>
      <p className="text-sm text-gray-500 mb-8">
        Actualizează starea și codurile CAEN pentru firmele importate.
      </p>

      {/* STARE */}
      <div className="border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-1">Import stare firmă</h2>
        <p className="text-sm text-gray-500 mb-4">
          Fișierele <code className="bg-gray-100 px-1 rounded">OD_STARE_FIRMA.CSV</code> și{' '}
          <code className="bg-gray-100 px-1 rounded">n_stare_firma.csv</code> de pe data.gov.ro
        </p>
        <div className="space-y-2">
          <FileInput label="Alege OD_STARE_FIRMA.CSV" file={stareFile} onChange={setStareFile} />
          <FileInput label="Alege n_stare_firma.csv (nomenclator)" file={stareNomenclator} onChange={setStareNomenclator} />
          <button
            onClick={handleStareUpload}
            disabled={!stareFile || !stareNomenclator || starePolling}
            className="w-full py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {starePolling ? 'În progres...' : 'Actualizează stare'}
          </button>
          {starePolling && (
            <button onClick={handleStareCancel}
              className="w-full py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">
              Anulează
            </button>
          )}
        </div>
        <StatusBox status={stareStatus} polling={starePolling} />
      </div>

      {/* CAEN */}
      <div className="border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-1">Import coduri CAEN</h2>
        <p className="text-sm text-gray-500 mb-4">
          Fișierele <code className="bg-gray-100 px-1 rounded">OD_CAEN_AUTORIZAT.CSV</code> și{' '}
          <code className="bg-gray-100 px-1 rounded">n_caen.csv</code> de pe data.gov.ro
        </p>
        <div className="space-y-2">
          <FileInput label="Alege OD_CAEN_AUTORIZAT.CSV" file={caenFile} onChange={setCaenFile} />
          <FileInput label="Alege n_caen.csv (nomenclator)" file={caenNomenclator} onChange={setCaenNomenclator} />
          <button
            onClick={handleCaenUpload}
            disabled={!caenFile || !caenNomenclator || caenPolling}
            className="w-full py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {caenPolling ? 'În progres...' : 'Actualizează CAEN'}
          </button>
          {caenPolling && (
            <button onClick={handleCaenCancel}
              className="w-full py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">
              Anulează
            </button>
          )}
        </div>
        <StatusBox status={caenStatus} polling={caenPolling} />
      </div>

      <div className="text-center">
        <a href="/" className="text-sm text-blue-600 hover:underline">← Înapoi la lista de firme</a>
      </div>
    </main>
  );
}