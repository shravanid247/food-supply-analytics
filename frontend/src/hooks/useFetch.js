import { useState, useEffect } from 'react';

const useFetch = (fetchFn, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = () => {
    setLoading(true);
    fetchFn()
      .then((res) => { setData(res); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  };

  useEffect(() => {
    refetch();
  }, deps);

  return { data, loading, error, refetch };
};

export default useFetch;