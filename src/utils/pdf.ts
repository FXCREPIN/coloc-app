import html2pdf from 'html2pdf.js';

export const generatePDF = async (content: string, filename: string): Promise<{ downloadUrl: string, textContent: string }> => {
  try {
    // Configuration PDF
    const opt = {
      margin: 10,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Générer le PDF comme un Blob
    console.log('Génération du PDF...');
    const worker = html2pdf().set(opt);
    const pdfBlob = await worker.from(content).output('blob');

    // Créer une URL pour le téléchargement immédiat
    const blobUrl = URL.createObjectURL(pdfBlob);
    
    // Déclencher le téléchargement
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Nettoyer l'URL du blob après le téléchargement
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

    console.log('PDF généré avec succès');

    // Extraire le contenu texte du HTML pour l'inclure dans l'email
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    return {
      downloadUrl: "Le PDF a été généré et téléchargé automatiquement sur votre ordinateur.",
      textContent: textContent.replace(/\s+/g, ' ').trim()
    };
  } catch (error) {
    console.error('Erreur détaillée lors de la génération du PDF:', error);
    let errorMessage = 'Impossible de générer le PDF';
    if (error instanceof Error) {
      errorMessage = `Erreur: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}; 