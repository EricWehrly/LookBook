import React from 'react';
import { productLookup } from '../products/productLookup';

// Step 1: Define an interface for the props
interface ResultProps {
  result: {
    code: number;
    format: string;
  };
}

// Step 2: Use the interface in the component function signature
const Result: React.FC<ResultProps> = ({ result }) => {

  const resolvedResult = productLookup(result.code, result.format);

  if(resolvedResult.name == "unrecognized") {
    return (
      <li>
        Unrecognized: {resolvedResult.barcode} (lookup failed)
        <br />
        <button>Try again</button>
        <button>Enter manually</button>
        <button>Request we do it for you</button>
      </li>
    );
  }
  
  return (
  <li>
    {result.code} [{result.format}]
  </li>
)};

export default Result;
