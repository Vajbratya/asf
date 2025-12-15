'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OrganizationFormData {
  name: string;
  slug: string;
  cnes: string;
  cnpj: string;
  type: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  billingEmail: string;
  technicalContactName: string;
  technicalContactEmail: string;
  technicalContactPhone: string;
}

interface OrganizationFormProps {
  onNext: (data: OrganizationFormData) => void;
  initialData?: Partial<OrganizationFormData>;
}

export function OrganizationForm({ onNext, initialData = {} }: OrganizationFormProps) {
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    slug: '',
    cnes: '',
    cnpj: '',
    type: 'HOSPITAL',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressZipCode: '',
    billingEmail: '',
    technicalContactName: '',
    technicalContactEmail: '',
    technicalContactPhone: '',
    ...initialData,
  });

  const handleChange = (field: keyof OrganizationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Organização</CardTitle>
          <CardDescription>Conte-nos sobre sua organização de saúde</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nome da Organização *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Hospital Santa Casa"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="slug">Identificador *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                placeholder="hospital-santa-casa"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este será parte da URL da sua organização
              </p>
            </div>

            <div>
              <Label htmlFor="type">Tipo de Organização *</Label>
              <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOSPITAL">Hospital</SelectItem>
                  <SelectItem value="CLINIC">Clínica</SelectItem>
                  <SelectItem value="LAB">Laboratório</SelectItem>
                  <SelectItem value="PHARMACY">Farmácia</SelectItem>
                  <SelectItem value="OTHER">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cnes">CNES *</Label>
              <Input
                id="cnes"
                value={formData.cnes}
                onChange={(e) => handleChange('cnes', e.target.value)}
                placeholder="1234567"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cadastro Nacional de Estabelecimentos de Saúde
              </p>
            </div>

            <div className="col-span-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => handleChange('cnpj', e.target.value)}
                placeholder="12.345.678/0001-90"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="addressStreet">Endereço *</Label>
              <Input
                id="addressStreet"
                value={formData.addressStreet}
                onChange={(e) => handleChange('addressStreet', e.target.value)}
                placeholder="Rua das Flores, 123"
                required
              />
            </div>

            <div>
              <Label htmlFor="addressCity">Cidade *</Label>
              <Input
                id="addressCity"
                value={formData.addressCity}
                onChange={(e) => handleChange('addressCity', e.target.value)}
                placeholder="São Paulo"
                required
              />
            </div>

            <div>
              <Label htmlFor="addressState">Estado *</Label>
              <Input
                id="addressState"
                value={formData.addressState}
                onChange={(e) => handleChange('addressState', e.target.value)}
                placeholder="SP"
                maxLength={2}
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="addressZipCode">CEP *</Label>
              <Input
                id="addressZipCode"
                value={formData.addressZipCode}
                onChange={(e) => handleChange('addressZipCode', e.target.value)}
                placeholder="01234-567"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações de Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="billingEmail">Email de Cobrança *</Label>
            <Input
              id="billingEmail"
              type="email"
              value={formData.billingEmail}
              onChange={(e) => handleChange('billingEmail', e.target.value)}
              placeholder="billing@hospital.com"
              required
            />
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-4">Contato Técnico</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="technicalContactName">Nome *</Label>
                <Input
                  id="technicalContactName"
                  value={formData.technicalContactName}
                  onChange={(e) => handleChange('technicalContactName', e.target.value)}
                  placeholder="João Silva"
                  required
                />
              </div>

              <div>
                <Label htmlFor="technicalContactEmail">Email *</Label>
                <Input
                  id="technicalContactEmail"
                  type="email"
                  value={formData.technicalContactEmail}
                  onChange={(e) => handleChange('technicalContactEmail', e.target.value)}
                  placeholder="joao.silva@hospital.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="technicalContactPhone">Telefone *</Label>
                <Input
                  id="technicalContactPhone"
                  type="tel"
                  value={formData.technicalContactPhone}
                  onChange={(e) => handleChange('technicalContactPhone', e.target.value)}
                  placeholder="(11) 98765-4321"
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Continuar
        </Button>
      </div>
    </form>
  );
}
