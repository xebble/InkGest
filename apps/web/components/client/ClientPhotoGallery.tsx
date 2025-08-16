'use client';

import { useState, useRef } from 'react';

interface Photo {
  id: string;
  url: string;
  title: string;
  description?: string;
  category: 'reference' | 'inspiration' | 'completed' | 'progress';
  uploadedAt: Date;
}

interface ClientPhotoGalleryProps {
  clientId: string;
}

export function ClientPhotoGallery({ clientId }: ClientPhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([
    {
      id: '1',
      url: '/api/placeholder/400/300',
      title: 'Reference Design 1',
      description: 'Traditional Japanese dragon design',
      category: 'reference',
      uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      url: '/api/placeholder/400/300',
      title: 'Color Inspiration',
      description: 'Color palette ideas for the dragon',
      category: 'inspiration',
      uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      url: '/api/placeholder/400/300',
      title: 'Session 1 Progress',
      description: 'Outline completed',
      category: 'progress',
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ]);
  
  const [filter, setFilter] = useState<'all' | 'reference' | 'inspiration' | 'completed' | 'progress'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPhotos = photos.filter(photo => 
    filter === 'all' || photo.category === filter
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'reference'); // Default category
        formData.append('title', file.name);

        const response = await fetch(`/api/clients/${clientId}/photos`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const result = await response.json();
        
        if (result.success) {
          const newPhoto: Photo = {
            id: result.data.id,
            url: result.data.url,
            title: result.data.title,
            description: result.data.description,
            category: result.data.category,
            uploadedAt: new Date(result.data.uploadedAt),
          };
          
          setPhotos(prev => [newPhoto, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload some photos. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/photos/${photoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }

      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      setSelectedPhoto(null);
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo. Please try again.');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'reference':
        return 'bg-blue-100 text-blue-800';
      case 'inspiration':
        return 'bg-purple-100 text-purple-800';
      case 'progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'reference':
        return 'Reference';
      case 'inspiration':
        return 'Inspiration';
      case 'progress':
        return 'Progress';
      case 'completed':
        return 'Completed';
      default:
        return category;
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          My Gallery
        </h2>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Upload Photos
            </>
          )}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'reference', label: 'Reference' },
          { key: 'inspiration', label: 'Inspiration' },
          { key: 'progress', label: 'Progress' },
          { key: 'completed', label: 'Completed' },
        ].map((option) => (
          <button
            key={option.key}
            onClick={() => setFilter(option.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === option.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No photos found
          </h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' 
              ? "Upload your first photos to get started."
              : `No ${filter} photos found.`
            }
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Upload Photos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative group cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(photo.category)}`}>
                  {getCategoryLabel(photo.category)}
                </span>
              </div>
              
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              
              <div className="mt-2">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {photo.title}
                </h3>
                <p className="text-xs text-gray-500">
                  {formatDate(photo.uploadedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedPhoto.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {formatDate(selectedPhoto.uploadedAt)}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedPhoto.category)}`}>
                  {getCategoryLabel(selectedPhoto.category)}
                </span>
                
                <button
                  onClick={() => handleDeletePhoto(selectedPhoto.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="w-full h-auto max-h-96 object-contain rounded-lg"
              />
              
              {selectedPhoto.description && (
                <p className="mt-4 text-gray-700">
                  {selectedPhoto.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}