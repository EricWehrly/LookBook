import React, { useState, useEffect, useId } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productLookup, UNRECOGNIZED_NAME } from '../products/productLookup';
import { ProductType, isHttpUrl } from '../products/productModel';
import { addProductToLook, findByBarcode, saveProduct } from '../products/productStore';

interface ResultProps {
  // An empty code means manual entry (no scan / camera or lookup unavailable)
  result: {
    code: string;
    format: string;
  }
}

type Notice = 'catalog' | 'unrecognized' | null;

const Result: React.FC<ResultProps> = ({ result }) => {
  const [barcode, setBarcode] = useState(result.code);
  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>(ProductType.Other);
  const [src, setSrc] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const uid = useId();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lookId = searchParams.get('look');

  useEffect(() => {
    // A late lookup answer must not overwrite what the user already typed,
    // nor set state after unmount.
    let cancelled = false;
    const fillIfEmpty = (setter: React.Dispatch<React.SetStateAction<string>>, value?: string) =>
      setter(current => current || value || '');

    const load = async () => {
      if (!result.code) return;

      const cataloged = findByBarcode(result.code);
      if (cataloged) {
        setNotice('catalog');
        fillIfEmpty(setName, cataloged.name);
        fillIfEmpty(setSrc, cataloged.src);
        fillIfEmpty(setPreviewImageUrl, cataloged.previewImageUrl);
        if (cataloged.type) setType(cataloged.type);
        return;
      }

      const resolved = await productLookup(result.code, result.format);
      if (cancelled) return;
      if (resolved.name === UNRECOGNIZED_NAME) {
        setNotice('unrecognized');
        return;
      }
      fillIfEmpty(setName, resolved.name);
      fillIfEmpty(setSrc, resolved.src);
      fillIfEmpty(setPreviewImageUrl, resolved.previewImageUrl);
    };

    load();
    return () => { cancelled = true; };
  }, [result.code, result.format]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const problems: string[] = [];
    if (!name.trim()) problems.push('Name is required.');
    if (src.trim() && !isHttpUrl(src.trim())) problems.push('Source URL must start with http:// or https://.');
    if (previewImageUrl.trim() && !isHttpUrl(previewImageUrl.trim())) {
      problems.push('Preview image URL must start with http:// or https://.');
    }
    setErrors(problems);
    if (problems.length > 0) return;

    const product = saveProduct({
      name,
      barcode,
      type,
      src: src.trim(),
      previewImageUrl: previewImageUrl.trim(),
    });

    if (lookId) {
      addProductToLook(lookId, product.id!);
      navigate(`/looks/${encodeURIComponent(lookId)}`);
    } else {
      navigate('/');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {notice === 'catalog' && <p>This product is already in your catalog. Saving will update it.</p>}
      {notice === 'unrecognized' && <p>We could not find this product. Please enter its details.</p>}
      <div>
        <label htmlFor={`${uid}-barcode`}>Barcode:</label>
        <input
          id={`${uid}-barcode`}
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={`${uid}-name`}>Name:</label>
        <input
          id={`${uid}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          aria-invalid={errors.some(error => error.startsWith('Name'))}
        />
      </div>
      <div>
        <label htmlFor={`${uid}-type`}>Type:</label>
        <select id={`${uid}-type`} value={type} onChange={(e) => setType(e.target.value as ProductType)}>
          {Object.values(ProductType).map(productType => (
            <option key={productType} value={productType}>{productType}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${uid}-src`}>Source URL:</label>
        <input
          id={`${uid}-src`}
          value={src}
          onChange={(e) => setSrc(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={`${uid}-previewImageUrl`}>Preview Image URL:</label>
        <input
          id={`${uid}-previewImageUrl`}
          value={previewImageUrl}
          onChange={(e) => setPreviewImageUrl(e.target.value)}
        />
      </div>
      {errors.length > 0 && (
        <div role="alert">
          {errors.map(error => <p key={error}>{error}</p>)}
        </div>
      )}
      <button type="submit">Save product</button>
    </form>
  );
};

export default Result;
