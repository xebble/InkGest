'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/switch';
import { Clock, Mail, MessageSquare, Settings, Eye, Save } from 'lucide-react';
import type { Locale } from '@/types';

interface ReminderTemplate {
  type: '24h' | '2h' | 'confirmation';
  name: string;
  description: string;
  templates: {
    [key in Locale]: {
      whatsapp: {
        templateName: string;
        fallbackText: string;
      };
      email: {
        subject: string;
        html: string;
        text: string;
      };
    };
  };
  variables: string[];
  isActive: boolean;
}

interface ReminderTemplateManagerProps {
  templates: ReminderTemplate[];
  onSave: (template: ReminderTemplate) => Promise<void>;
  onToggleActive: (type: string, active: boolean) => Promise<void>;
}

const defaultTemplate: ReminderTemplate = {
  type: '24h',
  name: '',
  description: '',
  templates: {
    es: {
      whatsapp: {
        templateName: '',
        fallbackText: ''
      },
      email: {
        subject: '',
        html: '',
        text: ''
      }
    },
    ca: {
      whatsapp: {
        templateName: '',
        fallbackText: ''
      },
      email: {
        subject: '',
        html: '',
        text: ''
      }
    },
    en: {
      whatsapp: {
        templateName: '',
        fallbackText: ''
      },
      email: {
        subject: '',
        html: '',
        text: ''
      }
    }
  },
  variables: ['clientName', 'serviceName', 'appointmentDate', 'appointmentTime', 'price'],
  isActive: true
};

const templateTypeLabels = {
  '24h': '24 Hours Before',
  '2h': '2 Hours Before',
  'confirmation': 'Confirmation Request'
};

const templateTypeIcons = {
  '24h': Clock,
  '2h': Clock,
  'confirmation': MessageSquare
};

const availableVariables = [
  'clientName',
  'serviceName',
  'appointmentDate',
  'appointmentTime',
  'price',
  'deposit',
  'confirmationUrl',
  'confirmationToken'
];

export default function ReminderTemplateManager({
  templates,
  onSave,
  onToggleActive
}: ReminderTemplateManagerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ReminderTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ReminderTemplate | null>(null);
  const [activeLocale, setActiveLocale] = useState<Locale>('es');
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [saving, setSaving] = useState(false);

  const handleEditTemplate = (template: ReminderTemplate) => {
    setEditingTemplate({ ...template });
    setSelectedTemplate(template);
  };

  const handleCreateTemplate = (type: '24h' | '2h' | 'confirmation') => {
    const newTemplate = {
      ...defaultTemplate,
      type,
      name: `${templateTypeLabels[type]} Reminder`,
      description: `Reminder sent ${templateTypeLabels[type].toLowerCase()}`
    };
    setEditingTemplate(newTemplate);
    setSelectedTemplate(null);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    setSaving(true);
    try {
      await onSave(editingTemplate);
      setEditingTemplate(null);
      setSelectedTemplate(null);
    } catch (error) {
      // TODO: Replace with proper error logging service
      // console.error('Failed to save template:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (template: ReminderTemplate) => {
    try {
      await onToggleActive(template.type, !template.isActive);
    } catch (error) {
      // TODO: Replace with proper error logging service
      // console.error('Failed to toggle template active state:', error);
    }
  };

  const updateTemplateField = (path: string, value: any) => {
    if (!editingTemplate) return;

    const pathParts = path.split('.');
    const updated = { ...editingTemplate };
    let current: any = updated;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (part) {
        current = current[part];
      }
    }

    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart) {
      current[lastPart] = value;
    }
    setEditingTemplate(updated);
  };

  const renderVariableHelp = () => (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-medium mb-2">Available Variables:</h4>
      <div className="flex flex-wrap gap-2">
        {availableVariables.map(variable => (
          <Badge key={variable} variant="secondary" className="text-xs">
            {`{{${variable}}}`}
          </Badge>
        ))}
      </div>
      <p className="text-xs text-gray-600 mt-2">
        Use these variables in your templates. They will be replaced with actual values when sending.
      </p>
    </div>
  );

  if (editingTemplate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {selectedTemplate ? 'Edit' : 'Create'} Reminder Template
            </h2>
            <p className="text-gray-600">
              Configure reminder templates for different scenarios
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingTemplate(null);
                setSelectedTemplate(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Template Configuration</CardTitle>
            <CardDescription>
              Configure the basic settings for this reminder template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-type">Template Type</Label>
                <Select
                  value={editingTemplate.type}
                  onValueChange={(value) =>
                    updateTemplateField('type', value as '24h' | '2h' | 'confirmation')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24 Hours Before</SelectItem>
                    <SelectItem value="2h">2 Hours Before</SelectItem>
                    <SelectItem value="confirmation">Confirmation Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={editingTemplate.name}
                  onChange={(e) => updateTemplateField('name', e.target.value)}
                  placeholder="Enter template name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={editingTemplate.description}
                onChange={(e) => updateTemplateField('description', e.target.value)}
                placeholder="Describe when and how this template is used"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="template-active"
                checked={editingTemplate.isActive}
                onCheckedChange={(checked) => updateTemplateField('isActive', checked)}
              />
              <Label htmlFor="template-active">Template is active</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template Content</CardTitle>
            <CardDescription>
              Configure the message content for different languages and channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div>
                  <Label>Language</Label>
                  <Select value={activeLocale} onValueChange={(value) => setActiveLocale(value as Locale)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="ca">Català</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Channel</Label>
                  <Select value={activeChannel} onValueChange={(value) => setActiveChannel(value as 'whatsapp' | 'email')}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Tabs value={activeChannel} onValueChange={(value) => setActiveChannel(value as 'whatsapp' | 'email')}>
                <TabsList>
                  <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="whatsapp" className="space-y-4">
                  <div>
                    <Label htmlFor="whatsapp-template-name">WhatsApp Template Name</Label>
                    <Input
                      id="whatsapp-template-name"
                      value={editingTemplate.templates[activeLocale].whatsapp.templateName}
                      onChange={(e) =>
                        updateTemplateField(`templates.${activeLocale}.whatsapp.templateName`, e.target.value)
                      }
                      placeholder="Enter WhatsApp Business API template name"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      This should match the template name configured in your WhatsApp Business API
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="whatsapp-fallback">Fallback Text</Label>
                    <Textarea
                      id="whatsapp-fallback"
                      value={editingTemplate.templates[activeLocale].whatsapp.fallbackText}
                      onChange={(e) =>
                        updateTemplateField(`templates.${activeLocale}.whatsapp.fallbackText`, e.target.value)
                      }
                      placeholder="Fallback text message if template fails"
                      rows={3}
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      This text will be sent if the WhatsApp template fails
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="email" className="space-y-4">
                  <div>
                    <Label htmlFor="email-subject">Email Subject</Label>
                    <Input
                      id="email-subject"
                      value={editingTemplate.templates[activeLocale].email.subject}
                      onChange={(e) =>
                        updateTemplateField(`templates.${activeLocale}.email.subject`, e.target.value)
                      }
                      placeholder="Enter email subject line"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email-html">HTML Content</Label>
                    <Textarea
                      id="email-html"
                      value={editingTemplate.templates[activeLocale].email.html}
                      onChange={(e) =>
                        updateTemplateField(`templates.${activeLocale}.email.html`, e.target.value)
                      }
                      placeholder="Enter HTML email content"
                      rows={8}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email-text">Plain Text Content</Label>
                    <Textarea
                      id="email-text"
                      value={editingTemplate.templates[activeLocale].email.text}
                      onChange={(e) =>
                        updateTemplateField(`templates.${activeLocale}.email.text`, e.target.value)
                      }
                      placeholder="Enter plain text email content"
                      rows={4}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {renderVariableHelp()}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reminder Templates</h2>
          <p className="text-gray-600">
            Manage templates for automatic appointment reminders
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {Object.entries(templateTypeLabels).map(([type, label]) => {
          const template = templates.find(t => t.type === type);
          const Icon = templateTypeIcons[type as keyof typeof templateTypeIcons];

          return (
            <Card key={type}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle>{label}</CardTitle>
                      <CardDescription>
                        {template?.description || `Configure ${label.toLowerCase()} reminder template`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {template && (
                      <Badge variant={template.isActive ? 'default' : 'secondary'}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                    <Switch
                      checked={template?.isActive || false}
                      onCheckedChange={() => template && handleToggleActive(template)}
                      disabled={!template}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {template ? (
                    <Button
                      variant="outline"
                      onClick={() => handleEditTemplate(template)}
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Edit Template
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleCreateTemplate(type as '24h' | '2h' | 'confirmation')}
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Create Template
                    </Button>
                  )}
                  {template && (
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}