declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number;
    filename?: string;
    image?: { type: string; quality: number };
    html2canvas?: { scale: number };
    jsPDF?: { unit: string; format: string; orientation: string };
  }

  interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance;
    from(content: string | HTMLElement): Html2PdfInstance;
    save(): Promise<Blob>;
    output(type: 'blob'): Promise<Blob>;
  }

  function html2pdf(): Html2PdfInstance;
  export = html2pdf;
} 