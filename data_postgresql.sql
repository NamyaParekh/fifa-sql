-- PostgreSQL version of FIFA player data
-- Create tables first
CREATE TABLE IF NOT EXISTS playerstats (
    player_id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    club VARCHAR(50),
    country VARCHAR(50),
    age INTEGER,
    overall_rating INTEGER,
    player_value INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS positions (
    position_id SERIAL PRIMARY KEY,
    position_name VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS playerpositions (
    player_id INTEGER REFERENCES playerstats(player_id),
    position_id INTEGER REFERENCES positions(position_id),
    PRIMARY KEY (player_id, position_id)
);

-- Insert positions
INSERT INTO positions (position_name) VALUES 
('GK'), ('CB'), ('LB'), ('RB'), ('CM'), ('LM'), ('RM'), ('CAM'), ('CDM'), ('ST'), ('LW'), ('RW');

-- Insert player data with player_value
INSERT INTO playerstats (player_id, name, club, country, age, overall_rating, player_value) VALUES
(1,'Lionel Messi','Inter Miami','Argentina',37,90,120),
(2,'Cristiano Ronaldo','Al Nassr','Portugal',39,89,95),
(3,'Kylian Mbappe','PSG','France',25,91,150),
(4,'Erling Haaland','Man City','Norway',24,91,140),
(5,'Kevin De Bruyne','Man City','Belgium',33,91,110),
(6,'Virgil van Dijk','Liverpool','Netherlands',33,89,85),
(7,'Mohamed Salah','Liverpool','Egypt',32,89,100),
(8,'Neymar Jr','Al Hilal','Brazil',32,89,90),
(9,'Harry Kane','Bayern Munich','England',31,90,115),
(10,'Jude Bellingham','Real Madrid','England',21,90,125),

(11,'Luka Modric','Real Madrid','Croatia',38,88,70),
(12,'Toni Kroos','Real Madrid','Germany',34,88,65),
(13,'Pedri','Barcelona','Spain',21,87,85),
(14,'Gavi','Barcelona','Spain',20,86,75),
(15,'Robert Lewandowski','Barcelona','Poland',36,90,80),
(16,'Karim Benzema','Al Ittihad','France',36,89,75),
(17,'Sadio Mane','Al Nassr','Senegal',32,86,70),
(18,'Heung-min Son','Tottenham','South Korea',32,88,85),
(19,'Bruno Fernandes','Man United','Portugal',30,88,90),
(20,'Marcus Rashford','Man United','England',26,86,75),

(21,'Bukayo Saka','Arsenal','England',23,87,95),
(22,'Martin Odegaard','Arsenal','Norway',25,88,80),
(23,'Declan Rice','Arsenal','England',25,87,85),
(24,'Rodri','Man City','Spain',28,89,80),
(25,'Phil Foden','Man City','England',24,88,85),

(26,'Bernardo Silva','Man City','Portugal',30,88,75),
(27,'Joao Cancelo','Barcelona','Portugal',30,86,65),
(28,'Achraf Hakimi','PSG','Morocco',26,86,70),
(29,'Alisson Becker','Liverpool','Brazil',32,89,75),
(30,'Ederson Moraes','Man City','Brazil',31,88,65),

(31,'Thibaut Courtois','Real Madrid','Belgium',32,89,70),
(32,'Marc Andre ter Stegen','Barcelona','Germany',32,89,65),
(33,'Jan Oblak','Atletico Madrid','Slovenia',31,88,70),
(34,'Manuel Neuer','Bayern Munich','Germany',38,88,60),
(35,'Joshua Kimmich','Bayern Munich','Germany',29,89,85),
(36,'Leon Goretzka','Bayern Munich','Germany',29,86,70),
(37,'Serge Gnabry','Bayern Munich','Germany',28,85,65),
(38,'Kingsley Coman','Bayern Munich','France',28,86,70),
(39,'Thomas Muller','Bayern Munich','Germany',34,87,65),
(40,'Jamal Musiala','Bayern Munich','Germany',21,88,90),

(41,'Vinicius Jr','Real Madrid','Brazil',24,89,110),
(42,'Rodrygo','Real Madrid','Brazil',23,87,85),
(43,'Federico Valverde','Real Madrid','Uruguay',26,88,75),
(44,'Eduardo Camavinga','Real Madrid','France',22,86,70),
(45,'Aurelien Tchouameni','Real Madrid','France',24,86,75),
(46,'Antoine Griezmann','Atletico Madrid','France',33,88,70),
(47,'Koke','Atletico Madrid','Spain',32,84,55),
(48,'Saul Niguez','Atletico Madrid','Spain',29,83,50),
(49,'Alvaro Morata','Atletico Madrid','Spain',31,84,65),
(50,'Yannick Carrasco','Al Shabab','Belgium',30,84,60),

(51,'Jack Grealish','Man City','England',28,85,70),
(52,'Mason Mount','Man United','England',25,84,65),
(53,'Reece James','Chelsea','England',24,85,70),
(54,'Enzo Fernandez','Chelsea','Argentina',23,85,75),
(55,'Raheem Sterling','Chelsea','England',29,85,65),
(56,'Thiago Silva','Chelsea','Brazil',39,84,45),
(57,'Moises Caicedo','Chelsea','Ecuador',22,84,70),
(58,'Federico Chiesa','Juventus','Italy',26,85,65),
(59,'Dusan Vlahovic','Juventus','Serbia',24,85,75),
(60,'Paul Pogba','Juventus','France',31,83,55),

(61,'Angel Di Maria','Benfica','Argentina',36,84,60),
(62,'Lorenzo Pellegrini','Roma','Italy',27,84,55),
(63,'Romelu Lukaku','Roma','Belgium',31,85,70),
(64,'Matthijs de Ligt','Bayern Munich','Netherlands',24,86,75),
(65,'Dayot Upamecano','Bayern Munich','France',25,85,65),
(66,'Ilkay Gundogan','Barcelona','Germany',33,86,60),
(67,'Raphinha','Barcelona','Brazil',27,85,70),
(68,'Jules Kounde','Barcelona','France',25,86,75),
(69,'Ronald Araujo','Barcelona','Uruguay',25,87,80),
(70,'Takefusa Kubo','Real Sociedad','Japan',23,84,60),

(71,'Lee Kang-in','PSG','South Korea',23,83,55),
(72,'Hirving Lozano','PSV','Mexico',28,84,60),
(73,'Christian Pulisic','AC Milan','USA',25,84,55),
(74,'Weston McKennie','Juventus','USA',25,83,50),
(75,'Tyler Adams','Bournemouth','USA',25,82,45),
(76,'Aaron Ramsdale','Arsenal','England',26,84,60),
(77,'Nick Pope','Newcastle','England',32,85,55),
(78,'John Stones','Man City','England',30,86,60),
(79,'Ben White','Arsenal','England',26,84,55),
(80,'Gabriel Magalhaes','Arsenal','Brazil',26,85,65),

(81,'Lisandro Martinez','Man United','Argentina',26,85,65),
(82,'Raphael Varane','Man United','France',31,86,60),
(83,'Milan Skriniar','PSG','Slovakia',29,86,65),
(84,'Alessandro Bastoni','Inter Milan','Italy',25,86,60),
(85,'Gleison Bremer','Juventus','Brazil',27,85,55),
(86,'Ciro Immobile','Lazio','Italy',34,85,50),
(87,'Luis Alberto','Lazio','Spain',31,84,55),
(88,'Memphis Depay','Atletico Madrid','Netherlands',30,84,50),
(89,'Gerard Moreno','Villarreal','Spain',32,85,55),
(90,'Moussa Diaby','Aston Villa','France',25,85,65),

(91,'Ollie Watkins','Aston Villa','England',28,85,70),
(92,'Douglas Luiz','Aston Villa','Brazil',26,84,55),
(93,'James Ward-Prowse','West Ham','England',29,84,50),
(94,'Jarrod Bowen','West Ham','England',27,85,65),
(95,'Lucas Paqueta','West Ham','Brazil',26,85,60),
(96,'Eberechi Eze','Crystal Palace','England',26,84,55),
(97,'Wilfried Zaha','Galatasaray','Ivory Coast',31,84,50),
(98,'Mauro Icardi','Galatasaray','Argentina',31,84,55);

-- Assign positions to players (sample data)
INSERT INTO playerpositions (player_id, position_id) VALUES
-- Goalkeepers
(29,1), (30,1), (31,1), (32,1), (33,1), (34,1), (76,1), (77,1),

-- Defenders  
(6,2), (64,2), (65,2), (68,2), (69,2), (78,2), (79,2), (80,2), (81,2), (82,2), (83,2), (84,2), (85,2),
-- Full backs
(53,3), (27,3), (79,3), (78,3), (53,4), (28,4), (78,4), (79,4),

-- Midfielders
(11,5), (12,5), (24,5), (26,5), (35,5), (36,5), (43,5), (44,5), (45,5), (47,5), (48,5), (62,5), (87,5),
-- Wingers
(13,6), (14,6), (25,6), (41,6), (42,6), (67,6), (70,6), (21,7), (18,7), (26,7), (51,7), (67,7), (70,7),
-- Attacking mids
(10,8), (13,8), (22,8), (25,8), (40,8), (43,8), (46,8), (24,9),

-- Forwards
(1,10), (2,10), (3,10), (4,10), (8,10), (9,10), (15,10), (17,10), (18,10), (20,10), (37,10), (38,10), (39,10), (40,10),
(41,11), (42,11), (51,11), (55,11), (58,11), (59,11), (63,11), (90,11), (91,11), (94,11), (95,11), (70,12), (18,12), (26,12), (42,12), (41,12);

-- Show data summary
SELECT 'Player Stats Created' as status, COUNT(*) as count FROM playerstats;
SELECT 'Positions Created' as status, COUNT(*) as count FROM positions;
SELECT 'Player Positions Created' as status, COUNT(*) as count FROM playerpositions;
