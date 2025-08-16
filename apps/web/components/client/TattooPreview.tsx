'use client';

import { useState, useRef } from 'react';

interface TattooPreviewProps {
  clientId: string;
}

interface BodyPart {
  id: string;
  name: string;
  image: string;
}

export function TattooPreview({ clientId }: TattooPreviewProps) {
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | null>(null);
  const [tattooDesign, setTattooDesign] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bodyParts: BodyPart[] = [
    { id: 'arm', name: 'Arm', image: '/api/placeholder/200/300' },
    { id: 'shoulder', name: 'Shoulder', image: '/api/placeholder/200/300' },
    { id: 'back', name: 'Back', image: '/api/placeholder/200/300' },
    { id: 'chest', name: 'Chest', image: '/api/placeholder/200/300' },
    { id: 'leg', name: 'Leg', image: '/api/placeholder/200/300' },
    { id: 'wrist', name: 'Wrist', image: '/api/placeholder/200/300' },
  ];

  const handleDesignUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a preview URL for the uploaded design
    const designUrl = URL.createObjectURL(file);
    setTattooDesign(designUrl);
  };

  const generatePreview = async () => {
    if (!selectedBodyPart || !tattooDesign) {
      alert('Please select a body part and upload a tattoo design first.');
      return;
    }

    setIsLoading(true);

    try {
      // In a real implementation, this would call an AI service to overlay the tattoo design
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create a mock preview by combining the body part and tattoo design
      // In reality, this would be done by an AI service
      setPreviewImage('/api/placeholder/400/600');
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Failed to generate preview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const savePreview = async () => {
    if (!previewImage) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/tattoo-previews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bodyPart: selectedBodyPart?.id,
          designUrl: tattooDesign,
          previewUrl: previewImage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preview');
      }

      alert('Preview saved successfully!');
    } catch (error) {
      console.error('Error saving preview:', error);
      alert('Failed to save preview. Please try again.');
    }
  };

  const resetPreview = () => {
    setSelectedBodyPart(null);
    setTattooDesign(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Tattoo Preview Tool
        </h2>
        
        <button
          onClick={resetPreview}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Reset
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How it works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Select the body part where you want the tattoo</li>
              <li>Upload your tattoo design or reference image</li>
              <li>Click "Generate Preview" to see how it would look</li>
              <li>Save the preview to discuss with your artist</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Controls */}
        <div className="space-y-6">
          {/* Step 1: Select Body Part */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              1. Select Body Part
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {bodyParts.map((bodyPart) => (
                <button
                  key={bodyPart.id}
                  onClick={() => setSelectedBodyPart(bodyPart)}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    selectedBodyPart?.id === bodyPart.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={bodyPart.image}
                      alt={bodyPart.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <span className="font-medium text-gray-900">
                      {bodyPart.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Upload Design */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              2. Upload Tattoo Design
            </h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {tattooDesign ? (
                <div className="space-y-4">
                  <img
                    src={tattooDesign}
                    alt="Tattoo design"
                    className="w-32 h-32 object-cover rounded-lg mx-auto"
                  />
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Design uploaded successfully</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Change design
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Click to upload
                    </button>
                    <p className="text-sm text-gray-500 mt-1">
                      or drag and drop your design here
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleDesignUpload}
              className="hidden"
            />
          </div>

          {/* Step 3: Generate Preview */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              3. Generate Preview
            </h3>
            
            <button
              onClick={generatePreview}
              disabled={!selectedBodyPart || !tattooDesign || isLoading}
              className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Preview...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Generate Preview
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Preview Result
          </h3>
          
          <div className="bg-gray-100 rounded-lg p-6 min-h-96 flex items-center justify-center">
            {previewImage ? (
              <div className="text-center space-y-4">
                <img
                  src={previewImage}
                  alt="Tattoo preview"
                  className="max-w-full max-h-80 object-contain rounded-lg shadow-lg"
                />
                
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={savePreview}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Preview
                  </button>
                  
                  <button
                    onClick={generatePreview}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                  </button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating your tattoo preview...</p>
                <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <p>Your tattoo preview will appear here</p>
                <p className="text-sm mt-1">Select a body part and upload a design to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Important Note:</p>
            <p>
              This preview tool provides an approximate visualization of how your tattoo might look. 
              The actual result may vary based on your skin tone, body contours, and the artist's technique. 
              Always consult with your tattoo artist for the most accurate representation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}