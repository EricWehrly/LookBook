import React, { useState, useEffect } from 'react';
import { productLookup } from '../products/productLookup';

interface ResultProps {
  result: {
    code: string;
    format: string;
  }
}

const Result: React.FC<ResultProps> = ({ result }) => {
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [src, setSrc] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState('');

  useEffect(() => {
    const resolvedResult = productLookup(result.code, result.format);
    if (resolvedResult) {
      setBarcode(resolvedResult.barcode);
      setName(resolvedResult.name || '');
      setSrc(resolvedResult.src || '');
      setPreviewImageUrl(resolvedResult.previewImageUrl || '');
    }
  }, [result.code, result.format]);

  return (
    <form>
      <label>{barcode}</label>
      <div>
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="src">Source URL:</label>
        <input
          id="src"
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="previewImageUrl">Preview Image URL:</label>
        <input
          id="previewImageUrl"
          value={previewImageUrl}
          onChange={(e) => setPreviewImageUrl(e.target.value)}
          required
        />
      </div>
    </form>
  );
};

export default Result;