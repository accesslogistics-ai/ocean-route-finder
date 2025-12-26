-- Criar tabela de mapeamento de portos por país
CREATE TABLE public.port_countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  port text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(country, port)
);

-- Habilitar RLS
ALTER TABLE public.port_countries ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - todos podem ler
CREATE POLICY "Anyone can read port_countries"
ON public.port_countries
FOR SELECT
USING (true);

-- Apenas admins podem modificar
CREATE POLICY "Admins can insert port_countries"
ON public.port_countries
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update port_countries"
ON public.port_countries
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete port_countries"
ON public.port_countries
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Adicionar campo country na tabela profiles (NULL = acesso total para admins)
ALTER TABLE public.profiles ADD COLUMN country text;

-- Criar função para verificar se usuário pode ver a tarifa
CREATE OR REPLACE FUNCTION public.can_view_tariff(_user_id uuid, _pod text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admin pode ver tudo
    has_role(_user_id, 'admin'::app_role)
    OR
    -- Usuário sem país definido pode ver tudo (fallback)
    (SELECT country FROM profiles WHERE user_id = _user_id) IS NULL
    OR
    -- Usuário pode ver tarifas para portos do seu país
    EXISTS (
      SELECT 1 
      FROM port_countries pc
      JOIN profiles p ON p.country = pc.country
      WHERE p.user_id = _user_id
        AND pc.port = _pod
    )
$$;

-- Criar função para obter países únicos
CREATE OR REPLACE FUNCTION public.get_unique_countries()
RETURNS TABLE(country text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT DISTINCT country FROM port_countries ORDER BY country;
$$;

-- Atualizar políticas RLS da tabela tariffs para usar a nova função
DROP POLICY IF EXISTS "Anyone can read tariffs" ON public.tariffs;

CREATE POLICY "Users can view tariffs based on country"
ON public.tariffs
FOR SELECT
USING (can_view_tariff(auth.uid(), pod));

-- Inserir dados de países e portos
-- América do Sul
INSERT INTO port_countries (country, port) VALUES
-- Brasil
('Brasil', 'Santos'), ('Brasil', 'Paranaguá'), ('Brasil', 'Itapoá'), ('Brasil', 'Navegantes'), ('Brasil', 'Rio Grande'),
('Brasil', 'Suape'), ('Brasil', 'Itajaí'), ('Brasil', 'Pecém'), ('Brasil', 'Manaus'), ('Brasil', 'Vitória'),
('Brasil', 'Salvador'), ('Brasil', 'São Francisco do Sul'), ('Brasil', 'Imbituba'), ('Brasil', 'Santarém'),
('Brasil', 'Vila do Conde'), ('Brasil', 'Aratu'), ('Brasil', 'Itaqui'), ('Brasil', 'Rio de Janeiro'),
('Brasil', 'Sepetiba'), ('Brasil', 'Fortaleza'), ('Brasil', 'Natal'), ('Brasil', 'Maceió'), ('Brasil', 'Cabedelo'), ('Brasil', 'Porto Velho'),
-- Argentina
('Argentina', 'Buenos Aires'), ('Argentina', 'Dock Sud'), ('Argentina', 'Zarate'), ('Argentina', 'Rosario'),
('Argentina', 'Bahia Blanca'), ('Argentina', 'Ushuaia'), ('Argentina', 'Puerto Madryn'), ('Argentina', 'Mar del Plata'), ('Argentina', 'San Lorenzo'),
-- Uruguai
('Uruguai', 'Montevidéu'), ('Uruguai', 'Nueva Palmira'),
-- Chile
('Chile', 'San Antonio'), ('Chile', 'Valparaíso'), ('Chile', 'Iquique'), ('Chile', 'Antofagasta'),
('Chile', 'Arica'), ('Chile', 'Coronel'), ('Chile', 'Lirquen'), ('Chile', 'Puerto Angamos'), ('Chile', 'San Vicente'), ('Chile', 'Punta Arenas'),
-- Colômbia
('Colômbia', 'Cartagena'), ('Colômbia', 'Buenaventura'), ('Colômbia', 'Barranquilla'), ('Colômbia', 'Santa Marta'), ('Colômbia', 'Turbo'),
-- Peru
('Peru', 'Callao'), ('Peru', 'Paita'), ('Peru', 'Matarani'), ('Peru', 'Ilo'), ('Peru', 'Salaverry'),
-- Equador
('Equador', 'Guayaquil'), ('Equador', 'Esmeraldas'), ('Equador', 'Manta'), ('Equador', 'Puerto Bolivar'),
-- Paraguai
('Paraguai', 'Assunção'), ('Paraguai', 'Villeta'),
-- Venezuela
('Venezuela', 'La Guaira'), ('Venezuela', 'Puerto Cabello'), ('Venezuela', 'Maracaibo'), ('Venezuela', 'Guanta'),

-- América do Norte
-- Estados Unidos
('Estados Unidos', 'Los Angeles'), ('Estados Unidos', 'Long Beach'), ('Estados Unidos', 'New York'), ('Estados Unidos', 'New Jersey'),
('Estados Unidos', 'Savannah'), ('Estados Unidos', 'Houston'), ('Estados Unidos', 'Seattle'), ('Estados Unidos', 'Tacoma'),
('Estados Unidos', 'Charleston'), ('Estados Unidos', 'Norfolk'), ('Estados Unidos', 'Oakland'), ('Estados Unidos', 'Miami'),
('Estados Unidos', 'Port Everglades'), ('Estados Unidos', 'Baltimore'), ('Estados Unidos', 'Jacksonville'), ('Estados Unidos', 'Philadelphia'),
('Estados Unidos', 'Boston'), ('Estados Unidos', 'New Orleans'), ('Estados Unidos', 'Mobile'), ('Estados Unidos', 'Wilmington'),
('Estados Unidos', 'Gulfport'), ('Estados Unidos', 'Tampa'), ('Estados Unidos', 'Portland'),
-- Canadá
('Canadá', 'Vancouver'), ('Canadá', 'Montreal'), ('Canadá', 'Prince Rupert'), ('Canadá', 'Halifax'),
('Canadá', 'Saint John'), ('Canadá', 'Toronto'), ('Canadá', 'Quebec City'),
-- México
('México', 'Manzanillo'), ('México', 'Veracruz'), ('México', 'Altamira'), ('México', 'Lazaro Cardenas'),
('México', 'Ensenada'), ('México', 'Progreso'), ('México', 'Mazatlan'), ('México', 'Guaymas'), ('México', 'Tampico'),

-- América Central e Caribe
('Panamá', 'Balboa'), ('Panamá', 'Manzanillo'), ('Panamá', 'Colon Container Terminal'), ('Panamá', 'Cristobal'), ('Panamá', 'Rodman'),
('Costa Rica', 'Moin'), ('Costa Rica', 'Puerto Limon'), ('Costa Rica', 'Caldera'),
('Guatemala', 'Puerto Quetzal'), ('Guatemala', 'Santo Tomas de Castilla'),
('Honduras', 'Puerto Cortes'), ('Honduras', 'San Lorenzo'),
('República Dominicana', 'Caucedo'), ('República Dominicana', 'Rio Haina'),
('Jamaica', 'Kingston'), ('Jamaica', 'Montego Bay'),
('Bahamas', 'Freeport'),
('Cuba', 'Mariel'), ('Cuba', 'Havana'),

-- Europa
-- Alemanha
('Alemanha', 'Hamburgo'), ('Alemanha', 'Bremerhaven'), ('Alemanha', 'Bremen'), ('Alemanha', 'Wilhelmshaven'), ('Alemanha', 'Rostock'), ('Alemanha', 'Duisburg'), ('Alemanha', 'Lubeck'),
-- Holanda
('Holanda', 'Rotterdam'), ('Holanda', 'Amsterdam'), ('Holanda', 'Vlissingen'), ('Holanda', 'Moerdijk'),
-- Bélgica
('Bélgica', 'Antuérpia'), ('Bélgica', 'Zeebrugge'), ('Bélgica', 'Ghent'),
-- França
('França', 'Le Havre'), ('França', 'Marselha'), ('França', 'Fos-sur-Mer'), ('França', 'Dunkerque'), ('França', 'Bordeaux'), ('França', 'Nantes'), ('França', 'Rouen'),
-- Espanha
('Espanha', 'Algeciras'), ('Espanha', 'Valencia'), ('Espanha', 'Barcelona'), ('Espanha', 'Bilbao'), ('Espanha', 'Las Palmas'), ('Espanha', 'Vigo'), ('Espanha', 'Tarragona'), ('Espanha', 'Málaga'),
-- Itália
('Itália', 'Gioia Tauro'), ('Itália', 'Gênova'), ('Itália', 'La Spezia'), ('Itália', 'Trieste'), ('Itália', 'Livorno'), ('Itália', 'Veneza'), ('Itália', 'Nápoles'), ('Itália', 'Ravenna'), ('Itália', 'Salerno'), ('Itália', 'Civitavecchia'),
-- Reino Unido
('Reino Unido', 'Felixstowe'), ('Reino Unido', 'Southampton'), ('Reino Unido', 'London Gateway'), ('Reino Unido', 'Liverpool'), ('Reino Unido', 'Immingham'), ('Reino Unido', 'Tilbury'), ('Reino Unido', 'Grangemouth'), ('Reino Unido', 'Teesport'), ('Reino Unido', 'Belfast'),
-- Portugal
('Portugal', 'Sines'), ('Portugal', 'Leixões'), ('Portugal', 'Lisboa'), ('Portugal', 'Setúbal'),
-- Polônia
('Polônia', 'Gdansk'), ('Polônia', 'Gdynia'), ('Polônia', 'Szczecin'),
-- Suécia
('Suécia', 'Gotemburgo'), ('Suécia', 'Estocolmo'), ('Suécia', 'Helsingborg'),
-- Dinamarca
('Dinamarca', 'Aarhus'), ('Dinamarca', 'Copenhague'),
-- Noruega
('Noruega', 'Oslo'), ('Noruega', 'Bergen'),
-- Finlândia
('Finlândia', 'Helsinque'), ('Finlândia', 'Kotka'), ('Finlândia', 'Rauma'),
-- Rússia
('Rússia', 'São Petersburgo'), ('Rússia', 'Novorossiysk'), ('Rússia', 'Kaliningrado'),
-- Turquia
('Turquia', 'Ambarli'), ('Turquia', 'Istambul'), ('Turquia', 'Mersin'), ('Turquia', 'Izmir'), ('Turquia', 'Gemlik'), ('Turquia', 'Gebze'), ('Turquia', 'Aliaga'),
-- Grécia
('Grécia', 'Pireu'), ('Grécia', 'Tessalônica'),
-- Malta
('Malta', 'Marsaxlokk'),

-- Ásia
-- China
('China', 'Xangai'), ('China', 'Ningbo-Zhoushan'), ('China', 'Shenzhen'), ('China', 'Guangzhou'), ('China', 'Qingdao'),
('China', 'Tianjin'), ('China', 'Xiamen'), ('China', 'Dalian'), ('China', 'Hong Kong'), ('China', 'Yingkou'),
('China', 'Lianyungang'), ('China', 'Rizhao'), ('China', 'Fuzhou'), ('China', 'Nanjing'), ('China', 'Yantai'),
-- Japão
('Japão', 'Tóquio'), ('Japão', 'Yokohama'), ('Japão', 'Nagoia'), ('Japão', 'Kobe'), ('Japão', 'Osaka'), ('Japão', 'Hakata'), ('Japão', 'Shimizu'), ('Japão', 'Kitakyushu'),
-- Coreia do Sul
('Coreia do Sul', 'Busan'), ('Coreia do Sul', 'Incheon'), ('Coreia do Sul', 'Gwangyang'), ('Coreia do Sul', 'Ulsan'), ('Coreia do Sul', 'Pyeongtaek'),
-- Taiwan
('Taiwan', 'Kaohsiung'), ('Taiwan', 'Taichung'), ('Taiwan', 'Keelung'), ('Taiwan', 'Taipé'),
-- Singapura
('Singapura', 'Singapura'),
-- Índia
('Índia', 'Nhava Sheva'), ('Índia', 'Mumbai'), ('Índia', 'Mundra'), ('Índia', 'Chennai'), ('Índia', 'Kolkata'),
('Índia', 'Cochin'), ('Índia', 'Visakhapatnam'), ('Índia', 'Tuticorin'), ('Índia', 'Pipavav'), ('Índia', 'Krishnapatnam'), ('Índia', 'Hazira'),
-- Vietnã
('Vietnã', 'Ho Chi Minh'), ('Vietnã', 'Cat Lai'), ('Vietnã', 'Cai Mep'), ('Vietnã', 'Haiphong'), ('Vietnã', 'Da Nang'),
-- Tailândia
('Tailândia', 'Laem Chabang'), ('Tailândia', 'Bangkok'),
-- Malásia
('Malásia', 'Port Klang'), ('Malásia', 'Tanjung Pelepas'), ('Malásia', 'Penang'), ('Malásia', 'Pasir Gudang'),
-- Indonésia
('Indonésia', 'Jacarta'), ('Indonésia', 'Tanjung Priok'), ('Indonésia', 'Surabaya'), ('Indonésia', 'Belawan'), ('Indonésia', 'Semarang'),
-- Filipinas
('Filipinas', 'Manila'), ('Filipinas', 'Batangas'), ('Filipinas', 'Davao'), ('Filipinas', 'Cebu'),
-- Paquistão
('Paquistão', 'Karachi'), ('Paquistão', 'Port Qasim'),
-- Sri Lanka
('Sri Lanka', 'Colombo'),
-- Bangladesh
('Bangladesh', 'Chittagong'), ('Bangladesh', 'Mongla'),
-- Arábia Saudita
('Arábia Saudita', 'Jeddah'), ('Arábia Saudita', 'Dammam'), ('Arábia Saudita', 'King Abdul Aziz'), ('Arábia Saudita', 'King Abdullah Port'), ('Arábia Saudita', 'Jubail'),
-- Emirados Árabes Unidos
('Emirados Árabes Unidos', 'Jebel Ali'), ('Emirados Árabes Unidos', 'Dubai'), ('Emirados Árabes Unidos', 'Khalifa Port'), ('Emirados Árabes Unidos', 'Abu Dhabi'), ('Emirados Árabes Unidos', 'Sharjah'),
-- Omã
('Omã', 'Salalah'), ('Omã', 'Sohar'),
-- Israel
('Israel', 'Haifa'), ('Israel', 'Ashdod'),

-- Oceania
-- Austrália
('Austrália', 'Melbourne'), ('Austrália', 'Sydney'), ('Austrália', 'Botany'), ('Austrália', 'Brisbane'), ('Austrália', 'Fremantle'), ('Austrália', 'Adelaide'), ('Austrália', 'Port Hedland'),
-- Nova Zelândia
('Nova Zelândia', 'Tauranga'), ('Nova Zelândia', 'Auckland'), ('Nova Zelândia', 'Lyttelton'), ('Nova Zelândia', 'Wellington'), ('Nova Zelândia', 'Napier'),

-- África
-- Egito
('Egito', 'Port Said'), ('Egito', 'Alexandria'), ('Egito', 'Damietta'), ('Egito', 'Sokhna'),
-- Marrocos
('Marrocos', 'Tanger Med'), ('Marrocos', 'Casablanca'), ('Marrocos', 'Agadir'),
-- África do Sul
('África do Sul', 'Durban'), ('África do Sul', 'Cape Town'), ('África do Sul', 'Port Elizabeth'), ('África do Sul', 'Ngqura'), ('África do Sul', 'Richards Bay'),
-- Nigéria
('Nigéria', 'Lagos'), ('Nigéria', 'Apapa'), ('Nigéria', 'Tin Can'), ('Nigéria', 'Lekki'), ('Nigéria', 'Onne'),
-- Quênia
('Quênia', 'Mombasa'), ('Quênia', 'Lamu'),
-- Tanzânia
('Tanzânia', 'Dar es Salaam'),
-- Gana
('Gana', 'Tema'), ('Gana', 'Takoradi'),
-- Costa do Marfim
('Costa do Marfim', 'Abidjan'), ('Costa do Marfim', 'San Pedro'),
-- Senegal
('Senegal', 'Dakar'),
-- Angola
('Angola', 'Luanda'), ('Angola', 'Lobito'),
-- Moçambique
('Moçambique', 'Maputo'), ('Moçambique', 'Beira'), ('Moçambique', 'Nacala');