import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'IntegraSaúde - Integração HL7 e FHIR para Hospitais Brasileiros',
  description:
    'Plataforma de integração que conecta Tasy, MV Soul, Pixeon e outros sistemas de saúde usando padrões HL7 e FHIR R4. Comece gratuitamente.',
  keywords: [
    'HL7',
    'FHIR',
    'integração hospitalar',
    'Tasy',
    'MV Soul',
    'Pixeon',
    'healthcare',
    'saúde',
    'Brasil',
    'RNDS',
  ],
  openGraph: {
    title: 'IntegraSaúde - Integração HL7 e FHIR para Hospitais',
    description: 'Conecte seus sistemas hospitalares em minutos, não em semanas.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
