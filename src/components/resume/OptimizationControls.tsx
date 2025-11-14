/**
 * Optimization Controls Component
 *
 * Controls for resume optimization:
 * - Job description input (textarea or file upload)
 * - Custom instructions
 * - Optimization mode (full/targeted)
 * - Configuration options
 * - Optimize button
 */

'use client';

import { useState } from 'react';
import { FileText, Settings, Zap, Upload } from 'lucide-react';
import { OptimizationConfig } from '@/lib/parsers/types';

interface OptimizationControlsProps {
  jobDescription: string;
  onJobDescriptionChange: (jd: string) => void;
  customInstructions?: string;
  onCustomInstructionsChange?: (instructions: string) => void;
  config: OptimizationConfig;
  onConfigChange: (config: OptimizationConfig) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  canOptimize: boolean;
}

export default function OptimizationControls({
  jobDescription,
  onJobDescriptionChange,
  customInstructions,
  onCustomInstructionsChange,
  config,
  onConfigChange,
  onOptimize,
  isOptimizing,
  canOptimize
}: OptimizationControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle JD file upload
  const handleJDFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      onJobDescriptionChange(text);
    } catch (error) {
      console.error('Failed to read JD file:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Optimization Settings</h3>

      {/* Job Description Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Job Description *
          </label>
          <label className="cursor-pointer text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Upload className="w-3 h-3" />
            <span>Upload .txt</span>
            <input
              type="file"
              accept=".txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleJDFileUpload(file);
                e.target.value = '';
              }}
              className="hidden"
            />
          </label>
        </div>
        <textarea
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          placeholder="Paste the job description here...&#10;&#10;Include:&#10;- Required skills and technologies&#10;- Qualifications&#10;- Responsibilities&#10;- Nice-to-have skills"
          className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          {jobDescription.length > 0 ? `${jobDescription.length} characters` : 'Required for optimization'}
        </p>
      </div>

      {/* Custom Instructions */}
      {onCustomInstructionsChange && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Custom Instructions (Optional)
          </label>
          <textarea
            value={customInstructions || ''}
            onChange={(e) => onCustomInstructionsChange(e.target.value)}
            placeholder="Example:&#10;- Use action verbs like 'developed', 'implemented', 'led'&#10;- Emphasize quantifiable results (%, numbers, metrics)&#10;- Focus on technical depth and system architecture&#10;- Maintain professional tone"
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
          />
        </div>
      )}

      {/* Optimization Mode */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Optimization Mode
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onConfigChange({ ...config, mode: 'targeted' })}
            className={`p-3 border-2 rounded-lg text-left transition-all ${
              config.mode === 'targeted'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className={`text-sm font-medium mb-1 ${
              config.mode === 'targeted' ? 'text-blue-900' : 'text-gray-900'
            }`}>
              Targeted
            </p>
            <p className="text-xs text-gray-600">
              Only optimize bullets with missing keywords (faster, cheaper)
            </p>
          </button>

          <button
            onClick={() => onConfigChange({ ...config, mode: 'full' })}
            className={`p-3 border-2 rounded-lg text-left transition-all ${
              config.mode === 'full'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className={`text-sm font-medium mb-1 ${
              config.mode === 'full' ? 'text-blue-900' : 'text-gray-900'
            }`}>
              Full
            </p>
            <p className="text-xs text-gray-600">
              Optimize all bullet points (thorough, more tokens)
            </p>
          </button>
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
        >
          <Settings className="w-4 h-4" />
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Settings</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3 pl-6 border-l-2 border-gray-200">
            {/* Max Concurrent Calls */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Max Concurrent Calls: {config.maxConcurrentCalls}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={config.maxConcurrentCalls}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    maxConcurrentCalls: parseInt(e.target.value)
                  })
                }
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Higher = faster optimization, but may hit rate limits
              </p>
            </div>

            {/* Preserve Length */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="preserveLength"
                checked={config.preserveLength}
                onChange={(e) =>
                  onConfigChange({ ...config, preserveLength: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="preserveLength" className="text-sm text-gray-700">
                Preserve bullet length (±5 words)
              </label>
            </div>

            {/* Maintain Tone */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="maintainTone"
                checked={config.maintainTone}
                onChange={(e) =>
                  onConfigChange({ ...config, maintainTone: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="maintainTone" className="text-sm text-gray-700">
                Maintain professional tone
              </label>
            </div>

            {/* Max Keywords Per Bullet */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Max Keywords Per Bullet: {config.maxKeywordsPerBullet}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={config.maxKeywordsPerBullet}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    maxKeywordsPerBullet: parseInt(e.target.value)
                  })
                }
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: 2-3 keywords per bullet
              </p>
            </div>

            {/* Min Confidence Score */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Min Confidence Score: {(config.minConfidenceScore * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.minConfidenceScore * 100}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    minConfidenceScore: parseInt(e.target.value) / 100
                  })
                }
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Only accept optimizations above this confidence threshold
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Optimize Button */}
      <button
        onClick={onOptimize}
        disabled={!canOptimize || isOptimizing}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
      >
        <Zap className="w-5 h-5" />
        <span>
          {isOptimizing
            ? 'Optimizing Resume...'
            : canOptimize
            ? 'Start Optimization'
            : 'Upload Resume & Add Job Description'}
        </span>
      </button>

      {isOptimizing && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 text-center">
            Processing... This may take 30-60 seconds
          </p>
        </div>
      )}

      {!canOptimize && !isOptimizing && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            ℹ️ Upload a resume and provide a job description to begin
          </p>
        </div>
      )}
    </div>
  );
}
