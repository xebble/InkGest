'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Edit, Trash2, MapPin, Check, X, AlertCircle } from 'lucide-react';

import type { RoomManagementProps, CreateRoomData, UpdateRoomData } from './types';
import type { Room } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

interface RoomFormData {
  name: string;
  description: string;
  isAvailable: boolean;
}

const RoomManagement: React.FC<RoomManagementProps> = ({
  rooms,
  onRoomCreate,
  onRoomUpdate,
  onRoomDelete,
}) => {
  const t = useTranslations('appointments.rooms');
  
  // State management
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState<Room | null>(null);
  
  const [formData, setFormData] = useState<RoomFormData>({
    name: '',
    description: '',
    isAvailable: true,
  });

  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      isAvailable: true,
    });
    setErrors({});
    setEditingRoom(null);
  }, []);

  // Open form for new room
  const handleNewRoom = useCallback(() => {
    resetForm();
    setIsFormOpen(true);
  }, [resetForm]);

  // Open form for editing room
  const handleEditRoom = useCallback((room: Room) => {
    setFormData({
      name: room.name,
      description: room.description || '',
      isAvailable: room.isAvailable,
    });
    setEditingRoom(room);
    setErrors({});
    setIsFormOpen(true);
  }, []);

  // Handle form field changes
  const handleFieldChange = useCallback(<K extends keyof RoomFormData>(
    field: K,
    value: RoomFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error
    if (field in errors) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: { name?: string; description?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameRequired');
    } else if (formData.name.length < 2) {
      newErrors.name = t('validation.nameMinLength');
    } else if (formData.name.length > 50) {
      newErrors.name = t('validation.nameMaxLength');
    }

    // Check for duplicate names (excluding current room when editing)
    const duplicateRoom = rooms.find(room => 
      room.name.toLowerCase() === formData.name.toLowerCase() &&
      room.id !== editingRoom?.id
    );
    
    if (duplicateRoom) {
      newErrors.name = t('validation.nameDuplicate');
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = t('validation.descriptionMaxLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, rooms, editingRoom, t]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRoom) {
        // Update existing room
        const updateData: UpdateRoomData = {
          id: editingRoom.id,
          name: formData.name.trim(),
          ...(formData.description.trim() && { description: formData.description.trim() }),
          isAvailable: formData.isAvailable,
        };
        await onRoomUpdate(editingRoom.id, updateData);
      } else {
        // Create new room
        const createData: CreateRoomData = {
          storeId: '', // This should be passed from parent component
          name: formData.name.trim(),
          ...(formData.description.trim() && { description: formData.description.trim() }),
          isAvailable: formData.isAvailable,
        };
        await onRoomCreate(createData);
      }
      
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving room:', error);
      // TODO: Show error notification
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingRoom, validateForm, onRoomCreate, onRoomUpdate, resetForm]);

  // Handle room deletion
  const handleDeleteRoom = useCallback(async (room: Room) => {
    setIsSubmitting(true);
    try {
      await onRoomDelete(room.id);
      setDeleteConfirmRoom(null);
    } catch (error) {
      console.error('Error deleting room:', error);
      // TODO: Show error notification
    } finally {
      setIsSubmitting(false);
    }
  }, [onRoomDelete]);

  // Toggle room availability
  const handleToggleAvailability = useCallback(async (room: Room) => {
    try {
      const updateData: UpdateRoomData = {
        id: room.id,
        isAvailable: !room.isAvailable,
      };
      await onRoomUpdate(room.id, updateData);
    } catch (error) {
      console.error('Error toggling room availability:', error);
      // TODO: Show error notification
    }
  }, [onRoomUpdate]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">{t('title')}</h3>
          <Badge variant="secondary">{rooms.length}</Badge>
        </div>
        <Button onClick={handleNewRoom} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>{t('addRoom')}</span>
        </Button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <Card key={room.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900">{room.name}</h4>
                  <Badge 
                    variant={room.isAvailable ? 'success' : 'secondary'}
                    className="text-xs"
                  >
                    {room.isAvailable ? t('available') : t('unavailable')}
                  </Badge>
                </div>
                {room.description && (
                  <p className="text-sm text-gray-600 mb-2">{room.description}</p>
                )}
                <p className="text-xs text-gray-500">
                  {t('createdAt')}: {new Date(room.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Room Actions */}
            <div className="flex items-center justify-between pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleAvailability(room)}
                className="flex items-center space-x-1"
              >
                {room.isAvailable ? (
                  <>
                    <X className="h-3 w-3" />
                    <span>{t('disable')}</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3" />
                    <span>{t('enable')}</span>
                  </>
                )}
              </Button>

              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditRoom(room)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmRoom(room)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {/* Empty state */}
        {rooms.length === 0 && (
          <Card className="col-span-full p-8 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">{t('noRooms')}</h4>
            <p className="text-gray-600 mb-4">{t('noRoomsDescription')}</p>
            <Button onClick={handleNewRoom} className="flex items-center space-x-2 mx-auto">
              <Plus className="h-4 w-4" />
              <span>{t('addFirstRoom')}</span>
            </Button>
          </Card>
        )}
      </div>

      {/* Room Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          resetForm();
        }}
        title={editingRoom ? t('editRoom') : t('newRoom')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t('name')} *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder={t('namePlaceholder')}
              maxLength={50}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Room Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t('description')}
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              rows={3}
              maxLength={200}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
            <p className="text-xs text-gray-500">
              {formData.description.length}/200 {t('characters')}
            </p>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => handleFieldChange('isAvailable', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {t('isAvailable')}
              </span>
            </label>
            <p className="text-xs text-gray-500">{t('availabilityDescription')}</p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : null}
              <span>{editingRoom ? t('updateRoom') : t('createRoom')}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmRoom}
        onClose={() => setDeleteConfirmRoom(null)}
        title={t('deleteRoom')}
      >
        {deleteConfirmRoom && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-900">
                  {t('deleteConfirmation', { name: deleteConfirmRoom.name })}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {t('deleteWarning')}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmRoom(null)}
                disabled={isSubmitting}
              >
                {t('cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteRoom(deleteConfirmRoom)}
                disabled={isSubmitting}
                className="flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>{t('deleteRoom')}</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export { RoomManagement };