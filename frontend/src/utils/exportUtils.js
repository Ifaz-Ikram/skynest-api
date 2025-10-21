import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Export data to Excel file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {string} sheetName - Name of the sheet
 */
export const exportToExcel = (data, filename = 'export', sheetName = 'Sheet1') => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    
    return { success: true };
  } catch (error) {
    console.error('Excel export failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export multiple sheets to Excel file
 * @param {Array} sheets - Array of {data, sheetName} objects
 * @param {string} filename - Name of the file (without extension)
 */
export const exportMultipleToExcel = (sheets, filename = 'export') => {
  try {
    const workbook = XLSX.utils.book_new();
    
    sheets.forEach(sheet => {
      const worksheet = XLSX.utils.json_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName || 'Sheet');
    });
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    
    return { success: true };
  } catch (error) {
    console.error('Excel export failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export HTML element to PDF
 * @param {string} elementId - ID of the HTML element to export
 * @param {string} filename - Name of the PDF file (without extension)
 * @param {object} options - PDF options {orientation: 'portrait'|'landscape', format: 'a4'|'letter'}
 */
export const exportToPDF = async (elementId, filename = 'export', options = {}) => {
  try {
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`);
    }

    // Convert HTML element to canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.format || 'a4'
    });

    const imgWidth = options.orientation === 'landscape' ? 297 : 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Save PDF
    pdf.save(`${filename}.pdf`);
    
    return { success: true };
  } catch (error) {
    console.error('PDF export failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export data table with charts to PDF
 * @param {object} params - {title, data, chartElementId, filename}
 */
export const exportReportToPDF = async ({
  title = 'Report',
  data = [],
  chartElementId = null,
  filename = 'report',
  orientation = 'portrait'
}) => {
  try {
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 20;

    // Add title
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text(title, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Add timestamp
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(100);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Add chart if provided
    if (chartElementId) {
      const chartElement = document.getElementById(chartElementId);
      if (chartElement) {
        const chartCanvas = await html2canvas(chartElement, {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: '#ffffff'
        });

        const chartImgData = chartCanvas.toDataURL('image/png');
        const chartWidth = pageWidth - 20;
        const chartHeight = (chartCanvas.height * chartWidth) / chartCanvas.width;

        if (yPos + chartHeight > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.addImage(chartImgData, 'PNG', 10, yPos, chartWidth, chartHeight);
        yPos += chartHeight + 10;
      }
    }

    // Add data table
    if (data && data.length > 0) {
      if (yPos + 40 > pageHeight - 20) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(12);
      pdf.setTextColor(0);
      pdf.text('Data Summary', 10, yPos);
      yPos += 8;

      // Simple table rendering
      pdf.setFontSize(9);
      const columns = Object.keys(data[0]);
      const colWidth = (pageWidth - 20) / columns.length;

      // Table header
      pdf.setFont(undefined, 'bold');
      columns.forEach((col, i) => {
        pdf.text(col, 10 + (i * colWidth), yPos);
      });
      yPos += 6;

      // Table rows
      pdf.setFont(undefined, 'normal');
      data.slice(0, 20).forEach((row) => {
        if (yPos > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }

        columns.forEach((col, i) => {
          const value = String(row[col] || '');
          pdf.text(value.substring(0, 15), 10 + (i * colWidth), yPos);
        });
        yPos += 6;
      });

      if (data.length > 20) {
        pdf.setTextColor(100);
        pdf.text(`... and ${data.length - 20} more rows`, 10, yPos + 5);
      }
    }

    pdf.save(`${filename}.pdf`);
    
    return { success: true };
  } catch (error) {
    console.error('PDF export failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export chart as image
 * @param {string} chartElementId - ID of the chart element
 * @param {string} filename - Name of the image file
 * @param {string} format - 'png' or 'jpeg'
 */
export const exportChartAsImage = async (chartElementId, filename = 'chart', format = 'png') => {
  try {
    const element = document.getElementById(chartElementId);
    
    if (!element) {
      throw new Error(`Element with ID '${chartElementId}' not found`);
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    // Convert to blob and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    }, `image/${format}`);

    return { success: true };
  } catch (error) {
    console.error('Image export failed:', error);
    return { success: false, error: error.message };
  }
};

export default {
  exportToExcel,
  exportMultipleToExcel,
  exportToPDF,
  exportReportToPDF,
  exportChartAsImage
};
