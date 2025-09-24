import React, { useState, useEffect, useRef } from 'react';
import { resilientFetch } from '../services/fetch';

interface ImageWithProxyProps {
    src: string | null;
    alt: string;
    // className for the img element
    className: string; 
    // className for the wrapper div
    wrapperClassName?: string; 
    children?: React.ReactNode;
    fallback: React.ReactNode;
}

const ImageWithProxy: React.FC<ImageWithProxyProps> = ({ src, alt, className, wrapperClassName, children, fallback }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [error, setError] = useState(!src);
    const objectUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (!src) {
            setError(true);
            return;
        }

        let isMounted = true;
        setError(false);
        setImageSrc(null);
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }

        const fetchImage = async () => {
            try {
                const response = await resilientFetch(src, { timeout: 15000 });
                if (!response.ok) throw new Error(`Image fetch failed with status ${response.status}`);
                const blob = await response.blob();
                if (isMounted) {
                    const url = URL.createObjectURL(blob);
                    objectUrlRef.current = url;
                    setImageSrc(url);
                }
            } catch (e) {
                console.warn(`Failed to load image via proxy: ${src}`, e);
                if (isMounted) {
                    setError(true);
                }
            }
        };

        fetchImage();

        return () => {
            isMounted = false;
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }
        };
    }, [src]);

    if (error || !imageSrc) {
        return <div className={wrapperClassName}>{fallback}</div>;
    }

    return (
        <div className={wrapperClassName}>
            <img src={imageSrc} alt={alt} className={className} />
            {children}
        </div>
    );
};

export default ImageWithProxy;
