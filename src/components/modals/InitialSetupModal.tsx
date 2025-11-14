'use client';

/**
 * Initial Setup Modal - Appears when new document is uploaded
 * Explains UI features and offers auto-lock option
 */

import { useState } from 'react';
import { X, Lock, Unlock, AlertCircle, CheckCircle } from 'lucide-react';

interface InitialSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoLock: () => void;
  placeholderCount: number;
  totalLines: number;
}

export default function InitialSetupModal({
  isOpen,
  onClose,
  onAutoLock,
  placeholderCount,
  totalLines
}: InitialSetupModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  if (!isOpen) return null;

  const handleAutoLock = () => {
    onAutoLock();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Welcome to Resume-Craft-Pro
            </h2>
            <p className="text-sm text-gray-700 mt-1">
              Quick setup guide for your document
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    s <= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {s}
                </div>
                {s < totalSteps && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${
                      s < step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Step 1: How UI Works */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                How Resume-Craft-Pro Works
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      AI-Powered Document Editor
                    </p>
                    <p className="text-sm text-gray-800 mt-1">
                      Chat with the AI agent on the right to search, read, and edit your document.
                      The agent can understand natural language requests and make precise edits.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-300">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Three-Panel Layout:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-800">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Left:</strong> Chat history - switch between conversations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Center:</strong> Document preview - see your document with line numbers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Right:</strong> Chat interface - talk to the AI agent</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-300">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Using Citations:
                  </p>
                  <p className="text-sm text-gray-800">
                    Reference specific lines using <code className="bg-white px-1.5 py-0.5 rounded text-gray-900 border border-gray-300">@line5</code> or
                    ranges like <code className="bg-white px-1.5 py-0.5 rounded text-gray-900 border border-gray-300">@l5-10</code>.
                    The agent will focus on those exact locations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Line Locking Feature */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Line Locking Feature
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-300">
                  <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Protect Important Content
                    </p>
                    <p className="text-sm text-gray-800 mt-1">
                      Lock lines to prevent the AI from editing them. This is useful for protecting
                      legal language, signatures, or any content that must remain unchanged.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-red-600" />
                      <p className="text-sm font-semibold text-gray-900">Locked Lines</p>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-800">
                      <li className="flex items-start gap-1">
                        <span className="text-red-600">•</span>
                        <span>Cannot be edited by AI</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-red-600">•</span>
                        <span>Show red lock icon</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-red-600">•</span>
                        <span>Preserved during edits</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Unlock className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-semibold text-gray-900">Unlocked Lines</p>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-800">
                      <li className="flex items-start gap-1">
                        <span className="text-green-600">•</span>
                        <span>Can be edited by AI</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-green-600">•</span>
                        <span>Show green unlock icon</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-green-600">•</span>
                        <span>Editable on request</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-800">
                    <strong className="text-gray-900">Tip:</strong> Click the lock icon next to any line to toggle its lock status.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Placeholders and Auto-Lock */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Placeholders Detected
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-300">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Found {placeholderCount} placeholder line{placeholderCount !== 1 ? 's' : ''} in your document
                    </p>
                    <p className="text-sm text-gray-800 mt-1">
                      Placeholders are highlighted in yellow and represent fields that need to be filled in.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-300">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Common Placeholder Formats:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <code className="bg-white px-2 py-1 rounded border border-gray-300 text-gray-900">&lt;ClientName&gt;</code>
                    <code className="bg-white px-2 py-1 rounded border border-gray-300 text-gray-900">&#123;PartyName&#125;</code>
                    <code className="bg-white px-2 py-1 rounded border border-gray-300 text-gray-900">[DateOfSignature]</code>
                    <code className="bg-white px-2 py-1 rounded border border-gray-300 text-gray-900">$&#123;LawyerName&#125;</code>
                    <code className="bg-white px-2 py-1 rounded border border-gray-300 text-gray-900">&#123;&#123;LastName&#125;&#125;</code>
                    <code className="bg-white px-2 py-1 rounded border border-gray-300 text-gray-900">[[EmployeeSignature]]</code>
                  </div>
                </div>

                {placeholderCount > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300">
                    <p className="text-sm font-semibold text-gray-900 mb-3">
                      Recommended: Auto-Lock Non-Placeholder Lines
                    </p>
                    <p className="text-sm text-gray-800 mb-3">
                      Automatically lock all {totalLines - placeholderCount} lines that are NOT placeholders.
                      This protects your legal text while keeping placeholder fields editable.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleAutoLock}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors"
                      >
                        <Lock className="w-4 h-4" />
                        Auto-Lock Non-Placeholders
                      </button>
                      <button
                        onClick={handleSkip}
                        className="px-4 py-2 text-gray-800 font-medium hover:text-gray-900 transition-colors"
                      >
                        Skip (I'll lock manually)
                      </button>
                    </div>
                  </div>
                )}

                {placeholderCount === 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-800">
                      No placeholders were detected in your document. You can manually lock specific lines
                      to protect them from edits.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-700">
            Step {step} of {totalSteps}
          </div>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-800 font-medium hover:text-gray-900 transition-colors"
              >
                Back
              </button>
            )}
            {step < totalSteps ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSkip}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
