-- Tabela principal de tarifas de frete marítimo
CREATE TABLE public.tariffs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    carrier TEXT NOT NULL,
    pol TEXT NOT NULL,
    pod TEXT NOT NULL,
    price_20dc NUMERIC,
    price_40hc NUMERIC,
    price_40reefer NUMERIC,
    free_time TEXT,
    transit_time TEXT,
    ens_ams TEXT,
    subject_to TEXT,
    validity TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index para buscas frequentes
CREATE INDEX idx_tariffs_carrier ON public.tariffs(carrier);
CREATE INDEX idx_tariffs_pol ON public.tariffs(pol);
CREATE INDEX idx_tariffs_pod ON public.tariffs(pod);
CREATE INDEX idx_tariffs_route ON public.tariffs(pol, pod);

-- Habilitar RLS (mas permitir leitura pública por enquanto - sem autenticação)
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (todos podem ler)
CREATE POLICY "Anyone can read tariffs" 
ON public.tariffs 
FOR SELECT 
USING (true);

-- Política de inserção pública (temporário - sem autenticação)
CREATE POLICY "Anyone can insert tariffs" 
ON public.tariffs 
FOR INSERT 
WITH CHECK (true);

-- Política de update público (temporário - sem autenticação)
CREATE POLICY "Anyone can update tariffs" 
ON public.tariffs 
FOR UPDATE 
USING (true);

-- Política de delete público (temporário - sem autenticação)
CREATE POLICY "Anyone can delete tariffs" 
ON public.tariffs 
FOR DELETE 
USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_tariffs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tariffs_updated_at
BEFORE UPDATE ON public.tariffs
FOR EACH ROW
EXECUTE FUNCTION public.update_tariffs_updated_at();