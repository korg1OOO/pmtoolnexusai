import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface PDFExportSection {
  id: string;
  name: string;
  elementRef?: React.RefObject<HTMLElement>;
  selector?: string;
}

interface PDFExporterProps {
  title: string;
  filename?: string;
  sections?: PDFExportSection[];
  contentRef?: React.RefObject<HTMLElement>;
  orientation?: 'portrait' | 'landscape';
  showSectionPicker?: boolean;
  variant?: 'button' | 'dropdown';
}

export function PDFExporter({
  title,
  filename = 'export',
  sections = [],
  contentRef,
  orientation = 'portrait',
  showSectionPicker = false,
  variant = 'button',
}: PDFExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>(
    sections.map((s) => s.id)
  );

  const toggleSection = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const exportToPDF = async (exportType: 'full' | 'sections' = 'full') => {
    setIsExporting(true);
    setShowDialog(false);

    try {
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;

      // Add title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin, margin + 10);

      // Add timestamp
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Generated: ${new Date().toLocaleString()}`,
        margin,
        margin + 18
      );
      pdf.setTextColor(0, 0, 0);

      let yPosition = margin + 28;

      if (exportType === 'full' && contentRef?.current) {
        // Export full content
        const canvas = await html2canvas(contentRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Handle multi-page content
        let remainingHeight = imgHeight;
        let sourceY = 0;

        while (remainingHeight > 0) {
          const availableHeight = pageHeight - yPosition - margin;
          const heightToDraw = Math.min(availableHeight, remainingHeight);

          pdf.addImage(
            imgData,
            'PNG',
            margin,
            yPosition,
            imgWidth,
            imgHeight,
            undefined,
            'FAST',
            0
          );

          remainingHeight -= heightToDraw;
          sourceY += heightToDraw;

          if (remainingHeight > 0) {
            pdf.addPage();
            yPosition = margin;
          }
        }
      } else if (exportType === 'sections' && sections.length > 0) {
        // Export selected sections
        const sectionsToExport = sections.filter((s) =>
          selectedSections.includes(s.id)
        );

        for (let i = 0; i < sectionsToExport.length; i++) {
          const section = sectionsToExport[i];
          const element =
            section.elementRef?.current ||
            (section.selector
              ? document.querySelector(section.selector)
              : null);

          if (!element) continue;

          // Add section title
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(section.name, margin, yPosition);
          yPosition += 8;

          const canvas = await html2canvas(element as HTMLElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = contentWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          // Check if we need a new page
          if (yPosition + imgHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.addImage(
            imgData,
            'PNG',
            margin,
            yPosition,
            imgWidth,
            imgHeight,
            undefined,
            'FAST'
          );

          yPosition += imgHeight + 10;

          // Add separator between sections
          if (i < sectionsToExport.length - 1) {
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
          }
        }
      }

      // Add page numbers
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }

      pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  if (variant === 'dropdown') {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportToPDF('full')}>
              <FileText className="h-4 w-4 mr-2" />
              Export Full Page
            </DropdownMenuItem>
            {showSectionPicker && sections.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowDialog(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export Selected Sections...
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Sections to Export</DialogTitle>
              <DialogDescription>
                Choose which sections to include in the PDF export.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {sections.map((section) => (
                <div key={section.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={section.id}
                    checked={selectedSections.includes(section.id)}
                    onCheckedChange={() => toggleSection(section.id)}
                  />
                  <Label htmlFor={section.id}>{section.name}</Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => exportToPDF('sections')}
                disabled={selectedSections.length === 0}
              >
                Export PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => exportToPDF('full')}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Export PDF
    </Button>
  );
}
