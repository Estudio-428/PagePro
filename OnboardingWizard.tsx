'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  Icon,
  Link,
  Stepper,
  Text,
  Title,
  Alert,
} from '@nimbus-ds/components';
import { CheckCircleIcon, CodeIcon, TemplateIcon } from '@nimbus-ds/icons';

const STEPS = [
  {
    label: 'Instalar snippet',
    title: 'Instale o snippet no seu tema',
    description:
      'O snippet é um pequeno código que lê os blocos salvos e renderiza na página do produto. A instalação é feita uma única vez.',
  },
  {
    label: 'Criar template',
    title: 'Crie seu primeiro template',
    description:
      'Templates são conjuntos de blocos reutilizáveis. Crie um template com os blocos que você quer exibir nas páginas de produto.',
  },
  {
    label: 'Aplicar em produto',
    title: 'Aplique em um produto',
    description:
      'Selecione um produto e aplique o template. O conteúdo será salvo como metafield e renderizado automaticamente pelo snippet.',
  },
];

const SNIPPET_CODE = `{% if product.metafields.pagina_pro.blocks %}
  <div id="pagina-pro-blocks" data-blocks="{{ product.metafields.pagina_pro.blocks }}"></div>
  <script src="{{ 'pagina-pro.js' | asset_url }}" defer></script>
{% endif %}`;

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [snippetCopied, setSnippetCopied] = useState(false);

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(SNIPPET_CODE);
    setSnippetCopied(true);
    setTimeout(() => setSnippetCopied(false), 2000);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // Onboarding concluído — vai para criar template
      router.push('/app/templates/new');
    }
  };

  const handleSkip = () => {
    router.push('/app');
  };

  const step = STEPS[currentStep];

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="80vh"
      gap="6"
    >
      {/* Header */}
      <Box textAlign="center" maxWidth="480px">
        <Title as="h1">Bem-vindo ao Página Pro</Title>
        <Text color="neutral-textLow" marginTop="2">
          Siga os 3 passos abaixo para começar a melhorar a conversão das suas páginas de produto.
        </Text>
      </Box>

      {/* Stepper */}
      <Stepper
        steps={STEPS.map((s) => s.label)}
        activeStep={currentStep}
      />

      {/* Card do passo atual */}
      <Card maxWidth="560px" width="100%">
        <Card.Header>
          <Title as="h2" fontSize="base">
            Passo {currentStep + 1}: {step.title}
          </Title>
        </Card.Header>
        <Card.Body>
          <Box display="flex" flexDirection="column" gap="4">
            <Text color="neutral-textLow">{step.description}</Text>

            {/* Passo 1 — snippet */}
            {currentStep === 0 && (
              <Box display="flex" flexDirection="column" gap="3">
                <Alert appearance="warning">
                  <Text fontSize="caption">
                    Acesse o admin da Nuvemshop → Personalizar tema → Editar código → encontre o arquivo
                    <strong> product.html </strong> ou <strong> product.tpl</strong> e cole o snippet abaixo
                    antes do fechamento da tag <code>{'</article>'}</code>.
                  </Text>
                </Alert>
                <Box
                  backgroundColor="neutral-surface"
                  borderRadius="2"
                  padding="3"
                  position="relative"
                >
                  <Text as="pre" fontSize="caption" fontFamily="mono">
                    {SNIPPET_CODE}
                  </Text>
                </Box>
                <Button
                  appearance={snippetCopied ? 'success' : 'primary'}
                  onClick={handleCopySnippet}
                >
                  <Icon source={<CodeIcon />} />
                  {snippetCopied ? 'Copiado!' : 'Copiar snippet'}
                </Button>
                <Text fontSize="caption" color="neutral-textLow">
                  Precisa de ajuda?{' '}
                  <Link href="https://ajuda.nuvemshop.com.br" target="_blank">
                    Veja o tutorial por tema
                  </Link>
                </Text>
              </Box>
            )}

            {/* Passo 2 — template */}
            {currentStep === 1 && (
              <Box
                display="flex"
                alignItems="center"
                gap="3"
                backgroundColor="primary-surface"
                padding="4"
                borderRadius="2"
              >
                <Icon source={<TemplateIcon />} color="primary-interactive" />
                <Text>
                  Você vai criar um template com blocos como descrição rica, especificações,
                  FAQ e muito mais. O editor tem preview em tempo real.
                </Text>
              </Box>
            )}

            {/* Passo 3 — aplicar */}
            {currentStep === 2 && (
              <Box
                display="flex"
                alignItems="center"
                gap="3"
                backgroundColor="success-surface"
                padding="4"
                borderRadius="2"
              >
                <Icon source={<CheckCircleIcon />} color="success-interactive" />
                <Text>
                  Após aplicar, o conteúdo fica disponível na loja em segundos.
                  Você pode aplicar em 1 produto ou em centenas de uma vez.
                </Text>
              </Box>
            )}
          </Box>
        </Card.Body>
        <Card.Footer>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Button appearance="transparent" onClick={handleSkip}>
              Pular configuração
            </Button>
            <Button appearance="primary" onClick={handleNext}>
              {currentStep < STEPS.length - 1 ? 'Próximo passo' : 'Criar meu primeiro template'}
            </Button>
          </Box>
        </Card.Footer>
      </Card>
    </Box>
  );
}
