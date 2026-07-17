import { useRef, useEffect, useState } from 'react';
import { generateDocument } from '../lib/documentGenerator';
export function DocumentPreview({ data }) {
    const iframeRef = useRef(null);
    const [html, setHtml] = useState('');
    useEffect(() => {
        try {
            const generated = generateDocument(data);
            setHtml(generated);
        }
        catch (e) {
            setHtml(`<html><body style="background:#0a0a0f;color:#e2e8f0;font-family:sans-serif;padding:20px;"><p>Error generating document: ${e}</p></body></html>`);
        }
    }, [data]);
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe || !html)
            return;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        iframe.src = url;
        return () => URL.revokeObjectURL(url);
    }, [html]);
    return (<iframe ref={iframeRef} sandbox="allow-same-origin" title="Document Preview" style={{
            width: '100%',
            height: '600px',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            backgroundColor: '#0a0a0f',
        }}/>);
}
export function downloadDocument(data) {
    const html = generateDocument(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `TUF_${data.type.toUpperCase()}_${data.repName.replace(/\s+/g, '_')}.html`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
export function printDocument(data) {
    const html = generateDocument(data);
    const printWindow = window.open('', '_blank');
    if (!printWindow)
        return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
        printWindow.print();
    };
    // If onload already fired (synchronous write), print immediately
    if (printWindow.document.readyState === 'complete') {
        printWindow.print();
    }
}
//# sourceMappingURL=DocumentPreview.js.map