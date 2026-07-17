import React from 'react';
export function parseMarkdown(text) {
    if (!text)
        return null;
    const normalizedText = text.replace(/\\n/g, '\n');
    const lines = normalizedText.split('\n');
    const elements = [];
    let currentList = [];
    const renderInline = (str) => {
        const parts = str.split('**');
        return parts.map((part, index) => {
            if (index % 2 === 1) {
                return <strong key={index} className="text-white font-black">{part}</strong>;
            }
            return part;
        });
    };
    const flushList = (key) => {
        if (currentList.length > 0) {
            elements.push(<ul key={`ul-${key}`} className="list-disc pl-5 my-4 space-y-1.5 text-slate-300">
          {currentList}
        </ul>);
            currentList = [];
        }
    };
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('## ')) {
            flushList(index);
            const headerText = trimmed.replace(/^##\s+/, '');
            elements.push(<h3 key={index} className="text-base font-black text-cyan-400 uppercase tracking-[0.1em] mt-6 mb-3 first:mt-0">
          {renderInline(headerText)}
        </h3>);
        }
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const bulletText = trimmed.replace(/^[-*]\s+/, '');
            currentList.push(<li key={index} className="text-slate-300 leading-relaxed text-sm">
          {renderInline(bulletText)}
        </li>);
        }
        else if (trimmed === '') {
            flushList(index);
        }
        else {
            flushList(index);
            elements.push(<p key={index} className="text-slate-300 leading-relaxed text-sm mb-4">
          {renderInline(trimmed)}
        </p>);
        }
    });
    flushList(lines.length);
    return <div className="space-y-1">{elements}</div>;
}
//# sourceMappingURL=markdown.js.map