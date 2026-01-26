import { useEffect, useState } from 'react';
import client from '../api/client';
import { transformApiError, getUserFriendlyErrorMessage, logError } from '../utils/errorHandler';

interface UseDataFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useDataFetch<T>(
    endpoint: string,
    dataKey?: string
): UseDataFetchResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.get(endpoint);
            const fetchedData = dataKey ? response.data.data[dataKey] : response.data.data;
            setData(fetchedData);
        } catch (err: any) {
            const apiError = transformApiError(err);
            const errorMessage = getUserFriendlyErrorMessage(apiError);
            setError(errorMessage);
            logError(apiError, `useDataFetch: ${endpoint}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [endpoint]);

    return { data, loading, error, refetch: fetchData };
}
