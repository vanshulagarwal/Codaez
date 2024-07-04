import { useEffect, useState } from "react"
import { makeRequest } from "./makeRequest";

const useFetch = (url, makeCall = true) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!makeCall) {
                    return { data, loading, error };
                }
                setLoading(true);
                const resp = await makeRequest.get(url, {
                    withCredentials: true,
                })
                setData(resp.data);
            }
            catch (e) {
                console.log(e);
                setError(true);
            }
            setLoading(false);
        }
        fetchData();
    }, [url])

    return { data, loading, error };
}

export default useFetch;