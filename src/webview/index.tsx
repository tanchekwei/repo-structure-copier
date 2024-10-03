import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import StructurePreview from '../components/StructurePreview';

declare global {
  interface Window {
    initialData: any;
    acquireVsCodeApi?: () => {
      postMessage: (message: any) => void;
    };
  }
}

console.log('Webview script loaded');
console.log('Initial data:', window.initialData);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

if (window.initialData && typeof window.initialData === 'object') {
  root.render(
    <React.StrictMode>
      <StructurePreview structure={window.initialData} />
    </React.StrictMode>
  );
  // Add event listener for the custom event
  window.addEventListener('copy-to-clipboard', (event: Event) => {
    const customEvent = event as CustomEvent;
    const vscode = window.acquireVsCodeApi?.();
    if (vscode) {
      vscode.postMessage({ command: 'copyToClipboard', text: customEvent.detail });
    }
  });
} else {
  root.render(
    <React.StrictMode>
      <div>No valid initial data available</div>
    </React.StrictMode>
  );
  console.error('Invalid or missing initial data:', window.initialData);
}
