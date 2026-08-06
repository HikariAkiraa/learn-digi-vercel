import fs from 'fs';
import path from 'path';
import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export interface Resource {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: string;
  category: string;
  accent: string;
  hoverBorder: string;
  iconName: string;
  icon: LucideIcon;
  createdAt?: string;
}

export interface RawResourceData {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: string;
  category?: string;
  accent?: string;
  icon?: string;
  createdAt?: string;
}

const RESOURCES_FILE = path.join(process.cwd(), 'content', 'resources', 'resources.json');

const defaultAccents = [
  'bg-cyan-400',
  'bg-amber-400',
  'bg-emerald-400',
  'bg-purple-400',
  'bg-rose-400',
  'bg-indigo-400',
  'bg-red-400',
  'bg-teal-400',
];

export function getHoverBorderClass(accent: string): string {
  if (accent.includes('cyan')) return 'hover:border-cyan-400';
  if (accent.includes('amber') || accent.includes('gold')) return 'hover:border-amber-400';
  if (accent.includes('emerald')) return 'hover:border-emerald-400';
  if (accent.includes('purple')) return 'hover:border-purple-400';
  if (accent.includes('rose')) return 'hover:border-rose-400';
  if (accent.includes('indigo')) return 'hover:border-indigo-400';
  if (accent.includes('red')) return 'hover:border-red-400';
  if (accent.includes('navy')) return 'hover:border-sky-500';
  if (accent.includes('teal')) return 'hover:border-teal-400';
  return 'hover:border-cyan-400';
}

const initialSeedResources: RawResourceData[] = [
  {
    id: 'res-quartus-ii',
    title: 'Quartus II Web Edition v13.0sp1',
    description: 'FPGA design software suite for logic synthesis, schematic entry, VHDL/Verilog simulation, and hardware programming.',
    fileUrl: '/uploads/resources/quartus-ii-setup.exe',
    fileName: 'quartus-ii-v13-setup.exe',
    fileSize: '1.4 GB',
    category: 'Installer',
    accent: 'bg-cyan-400',
    icon: 'Download',
  },
  {
    id: 'res-logisim-simulator',
    title: 'Logisim Digital Circuit Simulator',
    description: 'Educational graphical tool for designing and simulating logic circuits with gates, multiplexers, arithmetic circuits, and memory.',
    fileUrl: '/uploads/resources/logisim-generic-2.7.1.jar',
    fileName: 'logisim-2.7.1.jar',
    fileSize: '6.8 MB',
    category: 'Installer',
    accent: 'bg-emerald-400',
    icon: 'Download',
  },
  {
    id: 'res-lab-sop-guide',
    title: 'Digital Laboratory SOP & Safety Guidelines',
    description: 'Official lab operating procedures, ESD safety standards, component handling protocol, and emergency guidelines.',
    fileUrl: '/uploads/resources/sop-keselamatan-laboratorium.pdf',
    fileName: 'sop-keselamatan-lab.pdf',
    fileSize: '850 KB',
    category: 'Dokumen',
    accent: 'bg-amber-400',
    icon: 'FileDown',
  },
  {
    id: 'res-report-template',
    title: 'Practicum Report Standard Template (.docx)',
    description: 'Official document template for weekly lab reports including abstract format, schematic diagrams, and data table layouts.',
    fileUrl: '/uploads/resources/template-laporan-praktikum.docx',
    fileName: 'template-laporan-praktikum.docx',
    fileSize: '320 KB',
    category: 'Dokumen',
    accent: 'bg-purple-400',
    icon: 'FileDown',
  },
];

export function getResources(): Resource[] {
  let rawList: RawResourceData[] = [];

  const dirPath = path.dirname(RESOURCES_FILE);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  if (fs.existsSync(RESOURCES_FILE)) {
    try {
      const fileData = fs.readFileSync(RESOURCES_FILE, 'utf-8');
      rawList = JSON.parse(fileData);
    } catch (e) {
      rawList = initialSeedResources;
    }
  } else {
    rawList = initialSeedResources;
    try {
      fs.writeFileSync(RESOURCES_FILE, JSON.stringify(initialSeedResources, null, 2), 'utf-8');
    } catch (e) {}
  }

  return rawList.map((item, index) => {
    const iconName = item.icon || 'FileDown';
    const IconComponent = (LucideIcons as Record<string, any>)[iconName] || LucideIcons.FileDown;
    const accent = item.accent || defaultAccents[index % defaultAccents.length];

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      fileUrl: item.fileUrl,
      fileName: item.fileName || path.basename(item.fileUrl),
      fileSize: item.fileSize || 'Attachment',
      category: item.category || 'Resource',
      accent,
      hoverBorder: getHoverBorderClass(accent),
      iconName,
      icon: IconComponent,
      createdAt: item.createdAt,
    };
  });
}

export function saveResources(resources: RawResourceData[]): void {
  const dirPath = path.dirname(RESOURCES_FILE);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(RESOURCES_FILE, JSON.stringify(resources, null, 2), 'utf-8');
}
