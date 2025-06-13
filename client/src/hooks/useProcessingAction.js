import { useState } from 'react';
import { useProcessing } from './useProcessing';

export default function useProcessingAction(action) {
  const { start, end } = useProcessing();
  const [loading, setLoading] = useState(false);

  const wrapped = async (...args) => {
    if (loading) return;
    setLoading(true);
    start();
    try {
      await action(...args);
    } finally {
      end();
      setLoading(false);
    }
  };

  return [wrapped, loading];
}
