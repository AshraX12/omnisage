/**
 * DicomViewer Component.
 * 
 * A self-contained, zero-dependency medical imaging canvas viewer.
 * Fetches raw DICOM binary buffers, parses the uncompressed pixel streams,
 * and renders them on an HTML5 canvas with interactive windowing (contrast/brightness) controls.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Sun, Maximize2, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { apiService } from '../services/apiService';

/**
 * Renders an interactive DICOM medical image viewer.
 * 
 * @param {Object} props
 * @param {Object} props.record - The DICOM record metadata object.
 * @returns {JSX.Element} The DICOM slice renderer.
 */
export default function DicomViewer({ record }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Radiology windowing settings
  const [windowCenter, setWindowCenter] = useState(128); // Brightness
  const [windowWidth, setWindowWidth] = useState(256);   // Contrast
  const [invertColors, setInvertColors] = useState(false);
  const [parsedMeta, setParsedMeta] = useState(null);

  // Stored parsed pixel variables
  const pixelDataRef = useRef(null);
  const widthRef = useRef(512);
  const heightRef = useRef(512);

  useEffect(() => {
    let active = true;

    const loadDicomFile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const fileUrl = apiService.getFileUrl(record.id);
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Failed to download DICOM file.");
        
        const arrayBuffer = await response.arrayBuffer();
        if (!active) return;

        // Parse raw DICOM metadata tags and pixels from ArrayBuffer
        parseDicomBuffer(arrayBuffer);
        
        setLoading(false);
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to parse medical image.");
          setLoading(false);
        }
      }
    };

    loadDicomFile();

    return () => {
      active = false;
    };
  }, [record.id]);

  // Re-draw canvas frame whenever window/level values or inversion changes
  useEffect(() => {
    drawFrame();
  }, [windowCenter, windowWidth, invertColors]);

  /**
   * Parses uncompressed DICOM array buffer to extract tag headers and pixel arrays.
   * 
   * @param {ArrayBuffer} buffer - The raw binary file buffer.
   */
  const parseDicomBuffer = (buffer) => {
    const view = new DataView(buffer);
    const len = buffer.byteLength;
    
    // Default fallback scan dimensions
    let width = 512;
    let height = 512;
    let bitsAllocated = 16;
    let pixelRepresentation = 0; // 0 = unsigned, 1 = signed
    let pixelDataOffset = -1;

    // Search for DICOM tags in the binary stream
    // Standard uncompressed tag markers:
    // Rows tag: (0028, 0010) -> Little Endian bytes: 28 00 10 00
    // Columns tag: (0028, 0011) -> Little Endian bytes: 28 00 11 00
    // Bits Allocated: (0028, 0100) -> Little Endian bytes: 28 00 00 01
    // Pixel Data: (7FE0, 0010) -> Little Endian bytes: E0 7F 10 00
    
    for (let i = 0; i < len - 8; i += 2) {
      const g = view.getUint16(i, true);
      const e = view.getUint16(i + 2, true);

      // Rows (Height)
      if (g === 0x0028 && e === 0x0010) {
        // VR is often present (e.g. 'US' or 'SS'), we skip 4 bytes
        const vr = String.fromCharCode(view.getUint8(i + 4), view.getUint8(i + 5));
        const valLen = view.getUint16(i + 6, true);
        if (vr === 'US' || vr === 'SS') {
          height = view.getUint16(i + 8, true);
        } else {
          // Explicit VR long format or Implicit VR
          height = view.getUint16(i + 10, true);
        }
      }
      
      // Columns (Width)
      if (g === 0x0028 && e === 0x0011) {
        const vr = String.fromCharCode(view.getUint8(i + 4), view.getUint8(i + 5));
        if (vr === 'US' || vr === 'SS') {
          width = view.getUint16(i + 8, true);
        } else {
          width = view.getUint16(i + 10, true);
        }
      }

      // Bits Allocated
      if (g === 0x0028 && e === 0x0002) {
        const valLen = view.getUint16(i + 6, true);
        // number of frames or channels
      }

      // Pixel Data Tag (7FE0, 0010)
      if (g === 0x7FE0 && e === 0x0010) {
        // Pixel data offset found
        const vr = String.fromCharCode(view.getUint8(i + 4), view.getUint8(i + 5));
        if (vr === 'OB' || vr === 'OW') {
          // Explicit VR: skip VR, reserve, and 4-byte length
          pixelDataOffset = i + 12;
        } else {
          // Implicit VR: skip tag and 4-byte length
          pixelDataOffset = i + 8;
        }
        break; // Stop parsing once we find pixel data
      }
    }

    if (pixelDataOffset === -1) {
      throw new Error("Unable to locate pixel data stream inside DICOM file.");
    }

    // Capture dimensions
    widthRef.current = width;
    heightRef.current = height;

    // Slice pixel array (assume 16-bit pixels for medical CT/MRI scans)
    const pixelBytes = len - pixelDataOffset;
    const numPixels = width * height;
    const pixelData = new Int16Array(numPixels);

    let offset = pixelDataOffset;
    for (let p = 0; p < numPixels; p++) {
      if (offset + 1 < len) {
        pixelData[p] = view.getInt16(offset, true);
        offset += 2;
      } else {
        break;
      }
    }

    pixelDataRef.current = pixelData;

    // Gather statistics for default windowing setup
    let minPix = 99999;
    let maxPix = -99999;
    for (let p = 0; p < numPixels; p++) {
      const v = pixelData[p];
      if (v < minPix) minPix = v;
      if (v > maxPix) maxPix = v;
    }

    const range = maxPix - minPix;
    setWindowCenter(Math.floor(minPix + range / 2));
    setWindowWidth(Math.floor(range > 0 ? range : 256));

    setParsedMeta({
      width,
      height,
      minPixel: minPix,
      maxPixel: maxPix,
      range
    });
  };

  /**
   * Scales and maps pixel values to RGB colors on canvas using current Window/Level.
   */
  const drawFrame = () => {
    const canvas = canvasRef.current;
    const pixelData = pixelDataRef.current;
    if (!canvas || !pixelData) return;

    const ctx = canvas.getContext('2d');
    const width = widthRef.current;
    const height = heightRef.current;

    canvas.width = width;
    canvas.height = height;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    // Windowing math: map pixel values to 0 - 255
    // val_scaled = ((pixel_val - (window_center - window_width/2)) / window_width) * 255
    const wMin = windowCenter - windowWidth / 2;
    const wMax = windowCenter + windowWidth / 2;
    const range = wMax - wMin || 1;

    for (let i = 0; i < pixelData.length; i++) {
      const val = pixelData[i];
      let intensity = ((val - wMin) / range) * 255;
      
      // Clamp values between 0 and 255
      intensity = Math.min(255, Math.max(0, intensity));

      if (invertColors) {
        intensity = 255 - intensity;
      }

      const pixelIdx = i * 4;
      data[pixelIdx] = intensity;     // Red
      data[pixelIdx + 1] = intensity; // Green
      data[pixelIdx + 2] = intensity; // Blue
      data[pixelIdx + 3] = 255;       // Alpha (Opaque)
    }

    ctx.putImageData(imgData, 0, 0);
  };

  return (
    <div className="flex flex-col h-full bg-black/90 rounded-2xl border border-white/5 overflow-hidden">
      {/* Top Bar controls */}
      <div className="flex items-center justify-between bg-slate-900 px-4 py-3 border-b border-white/5 text-xs">
        <div>
          <h4 className="font-semibold text-white truncate max-w-[200px]">
            {record.file_name}
          </h4>
          <span className="text-slate-400 font-mono text-[10px]">
            {record.dicom_metadata?.modality || "Modality: Unknown"} | {record.dicom_metadata?.study_description || "Scan"}
          </span>
        </div>

        <a
          href={apiService.getFileUrl(record.id)}
          download
          className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Download DCM</span>
        </a>
      </div>

      {/* Main Canvas Viewport */}
      <div className="flex-1 flex items-center justify-center p-6 relative min-h-[300px]">
        {loading && (
          <div className="flex flex-col items-center space-y-2.5 text-slate-400">
            <RefreshCw className="animate-spin h-7 w-7 text-primary-500" />
            <span className="text-xs">Streaming DICOM file bytes...</span>
          </div>
        )}
        
        {error && (
          <div className="flex flex-col items-center space-y-2.5 text-center text-rose-500 max-w-sm px-4">
            <AlertCircle className="h-8 w-8" />
            <span className="text-sm font-semibold">Unable to render DICOM image</span>
            <span className="text-xs text-slate-500 leading-relaxed">
              This scan format may utilize compressed transfer syntaxes (e.g. JPEG2000) not supported 
              by the offline basic canvas reader. You can still download the raw DCM file to view in desktop PACS.
            </span>
          </div>
        )}

        <canvas 
          ref={canvasRef} 
          className={`max-h-[380px] max-w-full rounded shadow-2xl ${loading || error ? 'hidden' : 'block'}`}
        />
      </div>

      {/* Adjustments control panel */}
      {!loading && !error && (
        <div className="bg-slate-900 p-4 border-t border-white/5 space-y-4">
          {/* Controls list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Window Center (Brightness) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Window Center (Brightness)</span>
                <span className="font-mono text-white">{windowCenter}</span>
              </div>
              <input
                type="range"
                min={parsedMeta ? parsedMeta.minPixel - 100 : 0}
                max={parsedMeta ? parsedMeta.maxPixel + 100 : 500}
                value={windowCenter}
                onChange={(e) => setWindowCenter(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
            </div>

            {/* Window Width (Contrast) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Window Width (Contrast)</span>
                <span className="font-mono text-white">{windowWidth}</span>
              </div>
              <input
                type="range"
                min={1}
                max={parsedMeta ? parsedMeta.range + 200 : 500}
                value={windowWidth}
                onChange={(e) => setWindowWidth(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
            </div>
          </div>

          {/* Quick buttons */}
          <div className="flex items-center justify-between text-xs pt-1">
            <button
              onClick={() => setInvertColors(!invertColors)}
              className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                invertColors 
                  ? 'bg-white text-black border-white' 
                  : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700'
              }`}
            >
              Invert Colors
            </button>

            {parsedMeta && (
              <span className="text-[10px] text-slate-500 font-mono">
                Size: {parsedMeta.width}x{parsedMeta.height} px | Range: [{parsedMeta.minPixel}, {parsedMeta.maxPixel}]
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
