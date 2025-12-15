'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TasyConfigForm } from './tasy-config-form';
import { MVSoulConfigForm } from './mv-soul-config-form';
import { PixeonConfigForm } from './pixeon-config-form';
import { GenericHL7ConfigForm } from './generic-hl7-config-form';
import { cn } from '@/lib/utils';

type VendorType = 'TASY' | 'MV_SOUL' | 'PIXEON' | 'GENERIC_HL7' | null;

interface VendorCardProps {
  name: string;
  logo: string;
  description: string;
  onClick: () => void;
  selected: boolean;
}

function VendorCard({ name, logo, description, onClick, selected }: VendorCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:border-primary',
        selected && 'border-primary ring-2 ring-primary'
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-center h-16 mb-2">
          <div className="text-4xl">{logo}</div>
        </div>
        <CardTitle className="text-center text-lg">{name}</CardTitle>
        <CardDescription className="text-center text-sm">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default function ConnectorSetupPage() {
  const [vendor, setVendor] = useState<VendorType>(null);

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connect Your Hospital System</h1>
          <p className="text-muted-foreground mt-2">
            Choose your hospital management system to get started
          </p>
        </div>

        {!vendor ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <VendorCard
              name="Philips Tasy"
              logo="🏥"
              description="Leading Brazilian HMS"
              onClick={() => setVendor('TASY')}
              selected={vendor === 'TASY'}
            />
            <VendorCard
              name="MV Soul"
              logo="💚"
              description="Comprehensive healthcare platform"
              onClick={() => setVendor('MV_SOUL')}
              selected={vendor === 'MV_SOUL'}
            />
            <VendorCard
              name="Pixeon"
              logo="🔷"
              description="Medical imaging & RIS/PACS"
              onClick={() => setVendor('PIXEON')}
              selected={vendor === 'PIXEON'}
            />
            <VendorCard
              name="Generic HL7"
              logo="📡"
              description="Any HL7 v2.x compatible system"
              onClick={() => setVendor('GENERIC_HL7')}
              selected={vendor === 'GENERIC_HL7'}
            />
          </div>
        ) : (
          <div>
            <Button variant="outline" onClick={() => setVendor(null)} className="mb-6">
              ← Change Vendor
            </Button>

            {vendor === 'TASY' && <TasyConfigForm />}
            {vendor === 'MV_SOUL' && <MVSoulConfigForm />}
            {vendor === 'PIXEON' && <PixeonConfigForm />}
            {vendor === 'GENERIC_HL7' && <GenericHL7ConfigForm />}
          </div>
        )}
      </div>
    </div>
  );
}
