const express = require('express');
const mysql = require('mysql2');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Load PKL data
let playerData = [];

try {
    const data = fs.readFileSync('./fifa_data.pkl', 'utf8');
    playerData = JSON.parse(data);
    console.log(`✓ Loaded ${playerData.length} players from PKL file`);
} catch (error) {
    console.error('Error loading PKL file:', error);
    playerData = [];
}

// Function to auto-detect the main player table
function detectPlayerTable(tables) {
    const tableNames = tables.map(row => Object.values(row)[0].toLowerCase());
    
    // Prioritize the actual table names based on user's database structure
    const playerTablePatterns = [
        'playerstats',  // User's main player table
        'player_data',
        'fifa_players', 
        'player_stats',
        'players',
        'player',
        'fifa_data',
        'football_players',
        'soccer_players'
    ];
    
    for (const pattern of playerTablePatterns) {
        const found = tableNames.find(name => name.includes(pattern));
        if (found) {
            return tables[tableNames.indexOf(found)][Object.keys(tables[0])[0]];
        }
    }
    
    return null;
}

// Function to get the correct table name
function getCorrectTableName() {
    return new Promise((resolve, reject) => {
        db.query('SHOW TABLES', (err, results) => {
            if (err) {
                reject(err);
                return;
            }
            
            const playerTable = detectPlayerTable(results);
            resolve(playerTable || 'players'); // fallback to 'players'
        });
    });
}

// API route to convert natural language to SQL
app.post('/api/nl-to-sql', (req, res) => {
    const { naturalLanguage } = req.body;
    
    if (!naturalLanguage) {
        return res.status(400).json({ error: 'No natural language input provided' });
    }
    
    try {
        // Use playerstats as the default table name since we know it exists
        const tableName = 'playerstats';
        const sqlQuery = convertNaturalLanguageToSQL(naturalLanguage, tableName);
        res.json({
            success: true,
            sqlQuery: sqlQuery,
            naturalLanguage: naturalLanguage,
            tableName: tableName
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Natural language to SQL conversion function
function convertNaturalLanguageToSQL(naturalLanguage, tableName = 'players') {
    const input = naturalLanguage.toLowerCase().trim();
    
    // Common patterns for FIFA data queries
    const patterns = {
        // Show all tables
        'show tables': 'SHOW TABLES;',
        'list tables': 'SHOW TABLES;',
        'what tables': 'SHOW TABLES;',
        
        // Count queries
        'count players': `SELECT COUNT(*) as total_players FROM ${tableName};`,
        'how many players': `SELECT COUNT(*) as total_players FROM ${tableName};`,
        'total players': `SELECT COUNT(*) as total_players FROM ${tableName};`,
        
        // Club-specific count queries
        'how many players play for chelsea': `SELECT COUNT(*) as total_players FROM ${tableName} WHERE club = 'Chelsea';`,
        'how many players play for manchester united': `SELECT COUNT(*) as total_players FROM ${tableName} WHERE club = 'Manchester United';`,
        'how many players play for arsenal': `SELECT COUNT(*) as total_players FROM ${tableName} WHERE club = 'Arsenal';`,
        'how many players play for liverpool': `SELECT COUNT(*) as total_players FROM ${tableName} WHERE club = 'Liverpool';`,
        'how many players play for barcelona': `SELECT COUNT(*) as total_players FROM ${tableName} WHERE club = 'Barcelona';`,
        'how many players play for real madrid': `SELECT COUNT(*) as total_players FROM ${tableName} WHERE club = 'Real Madrid';`,
        
        // Age-filtered queries
        'players above age 25': `SELECT COUNT(*) as total_players FROM ${tableName} WHERE age > 25;`,
        'players older than 25': `SELECT COUNT(*) as total_players FROM ${tableName} WHERE age > 25;`,
        'players over 25': `SELECT COUNT(*) as total_players FROM ${tableName} WHERE age > 25;`,
        'players below age 25': `SELECT COUNT(*) as total_players FROM ${tableName} WHERE age < 25;`,
        'players younger than 25': `SELECT COUNT(*) as total_players FROM ${tableName} WHERE age < 25;`,
        'players under 25': `SELECT COUNT(*) as total_players FROM ${tableName} WHERE age < 25;`,
        
        // Position-specific club queries (using proper joins)
        'how many goalkeepers play for chelsea': `SELECT COUNT(*) as total_goalkeepers FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE ps.club = 'Chelsea' AND p.position_name = 'GK';`,
        'how many goalkeepers play for manchester united': `SELECT COUNT(*) as total_goalkeepers FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE ps.club = 'Manchester United' AND p.position_name = 'GK';`,
        'how many goalkeepers play for arsenal': `SELECT COUNT(*) as total_goalkeepers FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE ps.club = 'Arsenal' AND p.position_name = 'GK';`,
        'how many goalkeepers play for liverpool': `SELECT COUNT(*) as total_goalkeepers FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE ps.club = 'Liverpool' AND p.position_name = 'GK';`,
        'how many goalkeepers play for barcelona': `SELECT COUNT(*) as total_goalkeepers FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE ps.club = 'Barcelona' AND p.position_name = 'GK';`,
        'how many goalkeepers play for real madrid': `SELECT COUNT(*) as total_goalkeepers FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE ps.club = 'Real Madrid' AND p.position_name = 'GK';`,
        
        // General position queries (using proper joins)
        'show all goalkeepers': `SELECT ps.name, ps.club, ps.age, p.position_name FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE p.position_name = 'GK' LIMIT 10;`,
        'show all strikers': `SELECT ps.name, ps.club, ps.age, p.position_name FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE p.position_name = 'ST' LIMIT 10;`,
        'show all defenders': `SELECT ps.name, ps.club, ps.age, p.position_name FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE p.position_name IN ('CB', 'LB', 'RB') LIMIT 10;`,
        'show all midfielders': `SELECT ps.name, ps.club, ps.age, p.position_name FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE p.position_name IN ('CM', 'LM', 'RM', 'CAM', 'CDM') LIMIT 10;`,
        'show all wingers': `SELECT ps.name, ps.club, ps.age, p.position_name FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE p.position_name IN ('LW', 'RW') LIMIT 10;`,
        'show all forwards': `SELECT ps.name, ps.club, ps.age, p.position_name FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE p.position_name IN ('ST', 'LW', 'RW') LIMIT 10;`,
        'how many goalkeepers': `SELECT COUNT(*) as total_goalkeepers FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE p.position_name = 'GK';`,
        'how many strikers': `SELECT COUNT(*) as total_strikers FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE p.position_name = 'ST';`,
        'how many defenders': `SELECT COUNT(*) as total_defenders FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE p.position_name IN ('CB', 'LB', 'RB');`,
        'how many midfielders': `SELECT COUNT(*) as total_midfielders FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE p.position_name IN ('CM', 'LM', 'RM', 'CAM', 'CDM');`,
        'how many wingers': `SELECT COUNT(*) as total_wingers FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE p.position_name IN ('LW', 'RW');`,
        'how many forwards': `SELECT COUNT(*) as total_forwards FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE p.position_name IN ('ST', 'LW', 'RW');`,
        
        // Select all with limit
        'show all players': `SELECT * FROM ${tableName} LIMIT 10;`,
        'list all players': `SELECT * FROM ${tableName} LIMIT 10;`,
        'all players': `SELECT * FROM ${tableName} LIMIT 10;`,
        
        // Nationality queries (using 'country' column)
        'show nationalities': `SELECT DISTINCT country FROM ${tableName} ORDER BY country;`,
        'list nationalities': `SELECT DISTINCT country FROM ${tableName} ORDER BY country;`,
        'different nationalities': `SELECT DISTINCT country FROM ${tableName} ORDER BY country;`,
        'show countries': `SELECT DISTINCT country FROM ${tableName} ORDER BY country;`,
        'list countries': `SELECT DISTINCT country FROM ${tableName} ORDER BY country;`,
        'different countries': `SELECT DISTINCT country FROM ${tableName} ORDER BY country;`,
        
        // Country-specific player queries
        'show players from england': `SELECT * FROM ${tableName} WHERE country = 'England' LIMIT 10;`,
        'show players from brazil': `SELECT * FROM ${tableName} WHERE country = 'Brazil' LIMIT 10;`,
        'show players from france': `SELECT * FROM ${tableName} WHERE country = 'France' LIMIT 10;`,
        'show players from germany': `SELECT * FROM ${tableName} WHERE country = 'Germany' LIMIT 10;`,
        'show players from spain': `SELECT * FROM ${tableName} WHERE country = 'Spain' LIMIT 10;`,
        'show players from italy': `SELECT * FROM ${tableName} WHERE country = 'Italy' LIMIT 10;`,
        'show players from argentina': `SELECT * FROM ${tableName} WHERE country = 'Argentina' LIMIT 10;`,
        'show players from portugal': `SELECT * FROM ${tableName} WHERE country = 'Portugal' LIMIT 10;`,
        'show players from netherlands': `SELECT * FROM ${tableName} WHERE country = 'Netherlands' LIMIT 10;`,
        'show players from belgium': `SELECT * FROM ${tableName} WHERE country = 'Belgium' LIMIT 10;`,
        'show players from usa': `SELECT * FROM ${tableName} WHERE country = 'USA' LIMIT 10;`,
        'show players from mexico': `SELECT * FROM ${tableName} WHERE country = 'Mexico' LIMIT 10;`,
        
        // Club-specific player queries
        'show players from chelsea': `SELECT * FROM ${tableName} WHERE club = 'Chelsea' LIMIT 10;`,
        'show players from manchester united': `SELECT * FROM ${tableName} WHERE club = 'Manchester United' LIMIT 10;`,
        'show players from arsenal': `SELECT * FROM ${tableName} WHERE club = 'Arsenal' LIMIT 10;`,
        'show players from liverpool': `SELECT * FROM ${tableName} WHERE club = 'Liverpool' LIMIT 10;`,
        'show players from barcelona': `SELECT * FROM ${tableName} WHERE club = 'Barcelona' LIMIT 10;`,
        'show players from real madrid': `SELECT * FROM ${tableName} WHERE club = 'Real Madrid' LIMIT 10;`,
        'show players from bayern munich': `SELECT * FROM ${tableName} WHERE club = 'Bayern Munich' LIMIT 10;`,
        'show players from psg': `SELECT * FROM ${tableName} WHERE club = 'PSG' LIMIT 10;`,
        'show players from manchester city': `SELECT * FROM ${tableName} WHERE club = 'Manchester City' LIMIT 10;`,
        'show players from juventus': `SELECT * FROM ${tableName} WHERE club = 'Juventus' LIMIT 10;`,
        'show players from ac milan': `SELECT * FROM ${tableName} WHERE club = 'AC Milan' LIMIT 10;`,
        'show players from inter milan': `SELECT * FROM ${tableName} WHERE club = 'Inter Milan' LIMIT 10;`,
        
        'average age': `SELECT AVG(age) as average_age FROM ${tableName};`,
        'average player age': `SELECT AVG(age) as average_age FROM ${tableName};`,
        'mean age': `SELECT AVG(age) as average_age FROM ${tableName};`,
        
        // Club queries
        'show clubs': `SELECT DISTINCT club FROM ${tableName} ORDER BY club;`,
        'list clubs': `SELECT DISTINCT club FROM ${tableName} ORDER BY club;`,
        'different clubs': `SELECT DISTINCT club FROM ${tableName} ORDER BY club;`,
        
        // Position queries (simple positions from playerstats table)
        'show positions': `SELECT DISTINCT position_name FROM positions ORDER BY position_name;`,
        'list positions': `SELECT DISTINCT position_name FROM positions ORDER BY position_name;`,
        'different positions': `SELECT DISTINCT position_name FROM positions ORDER BY position_name;`,
        
        // Value queries (using 'player_value' column)
        'show player values': `SELECT name, player_value FROM ${tableName} ORDER BY player_value DESC LIMIT 10;`,
        'show players whose value is more than 100': `SELECT * FROM ${tableName} WHERE player_value > 100 LIMIT 10;`,
        'show players whose value is greater than 100': `SELECT * FROM ${tableName} WHERE player_value > 100 LIMIT 10;`,
        'show players whose value is over 100': `SELECT * FROM ${tableName} WHERE player_value > 100 LIMIT 10;`,
        'show players whose value is above 100': `SELECT * FROM ${tableName} WHERE player_value > 100 LIMIT 10;`,
        'show players whose value is more than 50': `SELECT * FROM ${tableName} WHERE player_value > 50 LIMIT 10;`,
        'show players whose value is greater than 50': `SELECT * FROM ${tableName} WHERE player_value > 50 LIMIT 10;`,
        'show players whose value is over 50': `SELECT * FROM ${tableName} WHERE player_value > 50 LIMIT 10;`,
        'show players whose value is above 50': `SELECT * FROM ${tableName} WHERE player_value > 50 LIMIT 10;`,
        'show players whose value is less than 100': `SELECT * FROM ${tableName} WHERE player_value < 100 LIMIT 10;`,
        'show players whose value is below 100': `SELECT * FROM ${tableName} WHERE player_value < 100 LIMIT 10;`,
        'show players whose value is under 100': `SELECT * FROM ${tableName} WHERE player_value < 100 LIMIT 10;`,
        
        // Position table queries
        'show all positions': 'SELECT * FROM positions ORDER BY position_name;',
        'list all positions': 'SELECT * FROM positions ORDER BY position_name;',
        'basic positions': 'SELECT * FROM positions ORDER BY position_name;',
        
        // Player positions queries (joined tables)
        'show player positions': 'SELECT ps.name, p.position_name FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id LIMIT 10;',
        'players with positions': 'SELECT ps.name, p.position_name FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id LIMIT 10;',
        
        // ... (rest of the patterns remain the same)
        // Youngest players
        'youngest players': `SELECT * FROM ${tableName} ORDER BY age ASC LIMIT 10;`,
        'youngest': `SELECT * FROM ${tableName} ORDER BY age ASC LIMIT 10;`,
        'show youngest players': `SELECT * FROM ${tableName} ORDER BY age ASC LIMIT 10;`,
        'who are the youngest players': `SELECT * FROM ${tableName} ORDER BY age ASC LIMIT 10;`,
        
        // Oldest players
        'oldest players': `SELECT * FROM ${tableName} ORDER BY age DESC LIMIT 10;`,
        'oldest': `SELECT * FROM ${tableName} ORDER BY age DESC LIMIT 10;`,
        'show oldest players': `SELECT * FROM ${tableName} ORDER BY age DESC LIMIT 10;`,
        'who are the oldest players': `SELECT * FROM ${tableName} ORDER BY age DESC LIMIT 10;`,
        
        // PKL-specific advanced queries
        'show top rated players': `SELECT * FROM ${tableName} ORDER BY overall_rating DESC LIMIT 10;`,
        'show highest rated players': `SELECT * FROM ${tableName} ORDER BY overall_rating DESC LIMIT 10;`,
        'show best players': `SELECT * FROM ${tableName} ORDER BY overall_rating DESC LIMIT 10;`,
        'show most valuable players': `SELECT * FROM ${tableName} ORDER BY player_value DESC LIMIT 10;`,
        'show richest players': `SELECT * FROM ${tableName} ORDER BY player_value DESC LIMIT 10;`,
        'show most expensive players': `SELECT * FROM ${tableName} ORDER BY player_value DESC LIMIT 10;`,
        
        // Age-specific queries
        'show players under 25': `SELECT * FROM ${tableName} WHERE age < 25 LIMIT 10;`,
        'show players under 30': `SELECT * FROM ${tableName} WHERE age < 30 LIMIT 10;`,
        'show players over 30': `SELECT * FROM ${tableName} WHERE age > 30 LIMIT 10;`,
        'show players over 35': `SELECT * FROM ${tableName} WHERE age > 35 LIMIT 10;`,
        'show players between 25 and 30': `SELECT * FROM ${tableName} WHERE age BETWEEN 25 AND 30 LIMIT 10;`,
        'show players between 20 and 25': `SELECT * FROM ${tableName} WHERE age BETWEEN 20 AND 25 LIMIT 10;`,
        
        // Rating-specific queries
        'show players with rating above 90': `SELECT * FROM ${tableName} WHERE overall_rating > 90 LIMIT 10;`,
        'show players with rating above 85': `SELECT * FROM ${tableName} WHERE overall_rating > 85 LIMIT 10;`,
        'show players with rating above 80': `SELECT * FROM ${tableName} WHERE overall_rating > 80 LIMIT 10;`,
        'show elite players': `SELECT * FROM ${tableName} WHERE overall_rating >= 90 LIMIT 10;`,
        'show world class players': `SELECT * FROM ${tableName} WHERE overall_rating >= 88 LIMIT 10;`,
        
        // Value-specific queries
        'show players worth more than 100': `SELECT * FROM ${tableName} WHERE player_value > 100 LIMIT 10;`,
        'show players worth more than 80': `SELECT * FROM ${tableName} WHERE player_value > 80 LIMIT 10;`,
        'show players worth more than 60': `SELECT * FROM ${tableName} WHERE player_value > 60 LIMIT 10;`,
        'show players worth less than 50': `SELECT * FROM ${tableName} WHERE player_value < 50 LIMIT 10;`,
        'show budget players': `SELECT * FROM ${tableName} WHERE player_value < 60 LIMIT 10;`,
        'show premium players': `SELECT * FROM ${tableName} WHERE player_value > 100 LIMIT 10;`,
        
        // Club-specific advanced queries
        'show all chelsea players': `SELECT * FROM ${tableName} WHERE club = 'Chelsea' ORDER BY overall_rating DESC;`,
        'show all man city players': `SELECT * FROM ${tableName} WHERE club = 'Man City' ORDER BY overall_rating DESC;`,
        'show all man united players': `SELECT * FROM ${tableName} WHERE club = 'Man United' ORDER BY overall_rating DESC;`,
        'show all arsenal players': `SELECT * FROM ${tableName} WHERE club = 'Arsenal' ORDER BY overall_rating DESC;`,
        'show all liverpool players': `SELECT * FROM ${tableName} WHERE club = 'Liverpool' ORDER BY overall_rating DESC;`,
        'show all real madrid players': `SELECT * FROM ${tableName} WHERE club = 'Real Madrid' ORDER BY overall_rating DESC;`,
        'show all barcelona players': `SELECT * FROM ${tableName} WHERE club = 'Barcelona' ORDER BY overall_rating DESC;`,
        'show all bayern munich players': `SELECT * FROM ${tableName} WHERE club = 'Bayern Munich' ORDER BY overall_rating DESC;`,
        'show all psg players': `SELECT * FROM ${tableName} WHERE club = 'PSG' ORDER BY overall_rating DESC;`,
        
        // Country-specific advanced queries
        'show all english players': `SELECT * FROM ${tableName} WHERE country = 'England' ORDER BY overall_rating DESC;`,
        'show all brazilian players': `SELECT * FROM ${tableName} WHERE country = 'Brazil' ORDER BY overall_rating DESC;`,
        'show all french players': `SELECT * FROM ${tableName} WHERE country = 'France' ORDER BY overall_rating DESC;`,
        'show all german players': `SELECT * FROM ${tableName} WHERE country = 'Germany' ORDER BY overall_rating DESC;`,
        'show all spanish players': `SELECT * FROM ${tableName} WHERE country = 'Spain' ORDER BY overall_rating DESC;`,
        'show all portuguese players': `SELECT * FROM ${tableName} WHERE country = 'Portugal' ORDER BY overall_rating DESC;`,
        'show all argentine players': `SELECT * FROM ${tableName} WHERE country = 'Argentina' ORDER BY overall_rating DESC;`,
        'show all dutch players': `SELECT * FROM ${tableName} WHERE country = 'Netherlands' ORDER BY overall_rating DESC;`,
        'show all belgian players': `SELECT * FROM ${tableName} WHERE country = 'Belgium' ORDER BY overall_rating DESC;`,
        'show all italian players': `SELECT * FROM ${tableName} WHERE country = 'Italy' ORDER BY overall_rating DESC;`,
        
        // Combined advanced queries
        'show english players from chelsea': `SELECT * FROM ${tableName} WHERE country = 'England' AND club = 'Chelsea' ORDER BY overall_rating DESC;`,
        'show brazilian players from liverpool': `SELECT * FROM ${tableName} WHERE country = 'Brazil' AND club = 'Liverpool' ORDER BY overall_rating DESC;`,
        'show french players from real madrid': `SELECT * FROM ${tableName} WHERE country = 'France' AND club = 'Real Madrid' ORDER BY overall_rating DESC;`,
        'show german players from bayern munich': `SELECT * FROM ${tableName} WHERE country = 'Germany' AND club = 'Bayern Munich' ORDER BY overall_rating DESC;`,
        'show spanish players from barcelona': `SELECT * FROM ${tableName} WHERE country = 'Spain' AND club = 'Barcelona' ORDER BY overall_rating DESC;`,
        
        // Value + Club combinations
        'show chelsea players worth more than 70': `SELECT * FROM ${tableName} WHERE club = 'Chelsea' AND player_value > 70 ORDER BY player_value DESC;`,
        'show man city players worth more than 80': `SELECT * FROM ${tableName} WHERE club = 'Man City' AND player_value > 80 ORDER BY player_value DESC;`,
        'show real madrid players worth more than 90': `SELECT * FROM ${tableName} WHERE club = 'Real Madrid' AND player_value > 90 ORDER BY player_value DESC;`,
        'show barcelona players worth more than 70': `SELECT * FROM ${tableName} WHERE club = 'Barcelona' AND player_value > 70 ORDER BY player_value DESC;`,
        
        // Rating + Club combinations
        'show chelsea players with rating above 85': `SELECT * FROM ${tableName} WHERE club = 'Chelsea' AND overall_rating > 85 ORDER BY overall_rating DESC;`,
        'show man city players with rating above 85': `SELECT * FROM ${tableName} WHERE club = 'Man City' AND overall_rating > 85 ORDER BY overall_rating DESC;`,
        'show real madrid players with rating above 85': `SELECT * FROM ${tableName} WHERE club = 'Real Madrid' AND overall_rating > 85 ORDER BY overall_rating DESC;`,
        'show barcelona players with rating above 85': `SELECT * FROM ${tableName} WHERE club = 'Barcelona' AND overall_rating > 85 ORDER BY overall_rating DESC;`,
        
        // Age + Club combinations
        'show young chelsea players': `SELECT * FROM ${tableName} WHERE club = 'Chelsea' AND age < 25 ORDER BY age ASC;`,
        'show young man city players': `SELECT * FROM ${tableName} WHERE club = 'Man City' AND age < 25 ORDER BY age ASC;`,
        'show experienced chelsea players': `SELECT * FROM ${tableName} WHERE club = 'Chelsea' AND age > 30 ORDER BY age DESC;`,
        'show experienced man city players': `SELECT * FROM ${tableName} WHERE club = 'Man City' AND age > 30 ORDER BY age DESC;`,
        
        // Statistical queries
        'show average age': `SELECT AVG(age) as average_age FROM ${tableName};`,
        'show average rating': `SELECT AVG(overall_rating) as average_rating FROM ${tableName};`,
        'show average value': `SELECT AVG(player_value) as average_value FROM ${tableName};`,
        'show highest rated player': `SELECT * FROM ${tableName} ORDER BY overall_rating DESC LIMIT 1;`,
        'show most valuable player': `SELECT * FROM ${tableName} ORDER BY player_value DESC LIMIT 1;`,
        'show youngest player': `SELECT * FROM ${tableName} ORDER BY age ASC LIMIT 1;`,
        'show oldest player': `SELECT * FROM ${tableName} ORDER BY age DESC LIMIT 1;`,
        
        // Count queries
        'how many players from england': `SELECT COUNT(*) as count FROM ${tableName} WHERE country = 'England';`,
        'how many players from brazil': `SELECT COUNT(*) as count FROM ${tableName} WHERE country = 'Brazil';`,
        'how many players from france': `SELECT COUNT(*) as count FROM ${tableName} WHERE country = 'France';`,
        'how many players from germany': `SELECT COUNT(*) as count FROM ${tableName} WHERE country = 'Germany';`,
        'how many players from spain': `SELECT COUNT(*) as count FROM ${tableName} WHERE country = 'Spain';`,
        'how many players from chelsea': `SELECT COUNT(*) as count FROM ${tableName} WHERE club = 'Chelsea';`,
        'how many players from man city': `SELECT COUNT(*) as count FROM ${tableName} WHERE club = 'Man City';`,
        'how many players from real madrid': `SELECT COUNT(*) as count FROM ${tableName} WHERE club = 'Real Madrid';`,
        'how many players from barcelona': `SELECT COUNT(*) as count FROM ${tableName} WHERE club = 'Barcelona';`,
        'how many players from bayern munich': `SELECT COUNT(*) as count FROM ${tableName} WHERE club = 'Bayern Munich';`,
        'how many players over 30': `SELECT COUNT(*) as count FROM ${tableName} WHERE age > 30;`,
        'how many players under 25': `SELECT COUNT(*) as count FROM ${tableName} WHERE age < 25;`,
        'how many players with rating above 85': `SELECT COUNT(*) as count FROM ${tableName} WHERE overall_rating > 85;`,
        'how many players with rating above 90': `SELECT COUNT(*) as count FROM ${tableName} WHERE overall_rating > 90;`,
        'how many players worth more than 100': `SELECT COUNT(*) as count FROM ${tableName} WHERE player_value > 100;`,
        'how many players worth more than 80': `SELECT COUNT(*) as count FROM ${tableName} WHERE player_value > 80;`,
        
        // Comparison queries
        'show players better than messi': `SELECT * FROM ${tableName} WHERE overall_rating > 90 ORDER BY overall_rating DESC;`,
        'show players better than ronaldo': `SELECT * FROM ${tableName} WHERE overall_rating > 89 ORDER BY overall_rating DESC;`,
        'show players younger than messi': `SELECT * FROM ${tableName} WHERE age < 37 ORDER BY overall_rating DESC;`,
        'show players more valuable than messi': `SELECT * FROM ${tableName} WHERE player_value > 120 ORDER BY player_value DESC;`,
        
        // Special queries
        'show legends': `SELECT * FROM ${tableName} WHERE overall_rating >= 90 AND age >= 30 ORDER BY overall_rating DESC;`,
        'show rising stars': `SELECT * FROM ${tableName} WHERE overall_rating >= 85 AND age <= 25 ORDER BY overall_rating DESC;`,
        'show veterans': `SELECT * FROM ${tableName} WHERE age >= 35 ORDER BY overall_rating DESC;`,
        'show prospects': `SELECT * FROM ${tableName} WHERE age <= 22 AND overall_rating >= 80 ORDER BY overall_rating DESC;`,
        'show bargain players': `SELECT * FROM ${tableName} WHERE player_value < 50 AND overall_rating >= 85 ORDER BY overall_rating DESC;`,
        'show overpriced players': `SELECT * FROM ${tableName} WHERE player_value > 100 AND overall_rating < 85 ORDER BY player_value DESC;`,
        
        // Top lists
        'top 10 players': `SELECT * FROM ${tableName} ORDER BY overall_rating DESC LIMIT 10;`,
        'top 5 players': `SELECT * FROM ${tableName} ORDER BY overall_rating DESC LIMIT 5;`,
        'top 3 players': `SELECT * FROM ${tableName} ORDER BY overall_rating DESC LIMIT 3;`,
        'top 10 most valuable': `SELECT * FROM ${tableName} ORDER BY player_value DESC LIMIT 10;`,
        'top 5 most valuable': `SELECT * FROM ${tableName} ORDER BY player_value DESC LIMIT 5;`,
        'top 3 most valuable': `SELECT * FROM ${tableName} ORDER BY player_value DESC LIMIT 3;`,
        'top 10 youngest': `SELECT * FROM ${tableName} ORDER BY age ASC LIMIT 10;`,
        'top 5 youngest': `SELECT * FROM ${tableName} ORDER BY age ASC LIMIT 5;`,
        'top 3 youngest': `SELECT * FROM ${tableName} ORDER BY age ASC LIMIT 3;`,
        'top 10 oldest': `SELECT * FROM ${tableName} ORDER BY age DESC LIMIT 10;`,
        'top 5 oldest': `SELECT * FROM ${tableName} ORDER BY age DESC LIMIT 5;`,
        'top 3 oldest': `SELECT * FROM ${tableName} ORDER BY age DESC LIMIT 3;`
    };
    
    // Check for complex combined queries first (higher priority)
    if (input.includes('players from') && input.includes('who play for')) {
        const countryMatch = input.match(/players from\s+(\w+)\s+who play for\s+(\w+)/i);
        if (countryMatch) {
            const country = countryMatch[1];
            const club = countryMatch[2];
            return `SELECT * FROM ${tableName} WHERE country = '${country}' AND club = '${club}' LIMIT 10;`;
        }
    }
    
    if (input.includes('players from') && input.includes('who are')) {
        const countryMatch = input.match(/players from\s+(\w+)\s+who are\s+(\w+)/i);
        if (countryMatch) {
            const country = countryMatch[1];
            const position = countryMatch[2];
            return `SELECT * FROM ${tableName} WHERE country = '${country}' AND position = '${position}' LIMIT 10;`;
        }
    }
    
    // Handle complex triple-condition queries: country + club + value
    if (input.includes('players from') && input.includes('who play for') && input.includes('and their value is')) {
        const tripleMatch = input.match(/players from\s+(\w+)\s+who play for\s+(\w+)\s+and their value is\s+(?:more than|greater than|over|above)\s+(\d+)/i);
        if (tripleMatch) {
            const country = tripleMatch[1];
            const club = tripleMatch[2];
            const value = tripleMatch[3];
            return `SELECT * FROM ${tableName} WHERE country = '${country}' AND club = '${club}' AND player_value > ${value} LIMIT 10;`;
        }
        
        const tripleMatch2 = input.match(/players from\s+(\w+)\s+who play for\s+(\w+)\s+and their value is\s+(?:less than|below|under)\s+(\d+)/i);
        if (tripleMatch2) {
            const country = tripleMatch2[1];
            const club = tripleMatch2[2];
            const value = tripleMatch2[3];
            return `SELECT * FROM ${tableName} WHERE country = '${country}' AND club = '${club}' AND player_value < ${value} LIMIT 10;`;
        }
    }
    
    // Handle combined country and value queries
    if (input.includes('players from') && input.includes('whose value is')) {
        const countryValueMatch = input.match(/players from\s+(\w+)\s+whose value is\s+(?:more than|greater than|over|above)\s+(\d+)/i);
        if (countryValueMatch) {
            const location = countryValueMatch[1];
            const value = countryValueMatch[2];
            // Check if it's a country or club by checking common club names
            const commonClubs = ['chelsea', 'arsenal', 'liverpool', 'barcelona', 'real madrid', 'manchester united', 'manchester city', 'psg', 'bayern munich', 'juventus'];
            const isClub = commonClubs.includes(location.toLowerCase());
            
            if (isClub) {
                return `SELECT * FROM ${tableName} WHERE club = '${location}' AND player_value > ${value} LIMIT 10;`;
            } else {
                return `SELECT * FROM ${tableName} WHERE country = '${location}' AND player_value > ${value} LIMIT 10;`;
            }
        }
        
        const countryValueMatch2 = input.match(/players from\s+(\w+)\s+whose value is\s+(?:less than|below|under)\s+(\d+)/i);
        if (countryValueMatch2) {
            const location = countryValueMatch2[1];
            const value = countryValueMatch2[2];
            // Check if it's a country or club by checking common club names
            const commonClubs = ['chelsea', 'arsenal', 'liverpool', 'barcelona', 'real madrid', 'manchester united', 'manchester city', 'psg', 'bayern munich', 'juventus'];
            const isClub = commonClubs.includes(location.toLowerCase());
            
            if (isClub) {
                return `SELECT * FROM ${tableName} WHERE club = '${location}' AND player_value < ${value} LIMIT 10;`;
            } else {
                return `SELECT * FROM ${tableName} WHERE country = '${location}' AND player_value < ${value} LIMIT 10;`;
            }
        }
    }
    
    // Then check for exact matches
    if (patterns[input]) {
        return patterns[input];
    }
    
    // Check for partial matches
    for (const [pattern, sql] of Object.entries(patterns)) {
        if (input.includes(pattern)) {
            return sql;
        }
    }
    
    // Handle more complex queries with keywords
    if (input.includes('players from') && input.includes('country')) {
        const countryMatch = input.match(/from\s+(\w+)/i);
        if (countryMatch) {
            const country = countryMatch[1];
            return `SELECT * FROM ${tableName} WHERE country = '${country}' LIMIT 10;`;
        }
    }
    
    if (input.includes('players from') && input.includes('club')) {
        const clubMatch = input.match(/from\s+(\w+)/i);
        if (clubMatch) {
            const club = clubMatch[1];
            return `SELECT * FROM ${tableName} WHERE club = '${club}' LIMIT 10;`;
        }
    }
    
    if (input.includes('players play for') || input.includes('player plays for')) {
        const clubMatch = input.match(/(?:play for|plays for)\s+(\w+)/i);
        if (clubMatch) {
            const club = clubMatch[1];
            if (input.includes('how many') || input.includes('count')) {
                return `SELECT COUNT(*) as total_players FROM ${tableName} WHERE club = '${club}';`;
            } else {
                return `SELECT * FROM ${tableName} WHERE club = '${club}' LIMIT 10;`;
            }
        }
    }
    
    // Handle position-specific queries with clubs
    if (input.includes('goalkeepers') && (input.includes('play for') || input.includes('at'))) {
        const clubMatch = input.match(/(?:play for|plays for|at)\s+(\w+)/i);
        if (clubMatch) {
            const club = clubMatch[1];
            if (input.includes('how many') || input.includes('count')) {
                return `SELECT COUNT(*) as total_goalkeepers FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE ps.club = '${club}' AND p.position_name = 'GK';`;
            } else {
                return `SELECT ps.name, ps.club, ps.age, p.position_name FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE ps.club = '${club}' AND p.position_name = 'GK' LIMIT 10;`;
            }
        }
    }
    
    // Handle other position-specific queries with clubs
    const positions = {
        'strikers': 'ST',
        'defenders': ['CB', 'LB', 'RB'],
        'midfielders': ['CM', 'LM', 'RM', 'CAM', 'CDM'],
        'forwards': ['ST', 'LW', 'RW'],
        'wingers': ['LW', 'RW']
    };
    
    for (const [positionName, positionCode] of Object.entries(positions)) {
        if (input.includes(positionName) && input.includes('play for')) {
            const clubMatch = input.match(/(?:play for|plays for)\s+(\w+)/i);
            if (clubMatch) {
                const club = clubMatch[1];
                if (input.includes('how many') || input.includes('count')) {
                    const positionCondition = Array.isArray(positionCode) 
                        ? `p.position_name IN ('${positionCode.join("', '")}')`
                        : `p.position_name = '${positionCode}'`;
                    return `SELECT COUNT(*) as total_${positionName} FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE ps.club = '${club}' AND ${positionCondition};`;
                } else {
                    const positionCondition = Array.isArray(positionCode) 
                        ? `p.position_name IN ('${positionCode.join("', '")}')`
                        : `p.position_name = '${positionCode}'`;
                    return `SELECT * FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE ps.club = '${club}' AND ${positionCondition} LIMIT 10;`;
                }
            }
        }
    }
    
    // Handle "show [position] for [club]" patterns
    if (input.includes('show') && input.includes('goalkeepers') && input.includes('for')) {
        const clubMatch = input.match(/(?:goalkeepers)\s+(?:for|at)\s+(\w+)/i);
        if (clubMatch) {
            const club = clubMatch[1];
            return `SELECT ps.name, ps.club, ps.age, p.position_name FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE ps.club = '${club}' AND p.position_name = 'GK' LIMIT 10;`;
        }
    }
    
    if (input.includes('players with position')) {
        const positionMatch = input.match(/position\s+(\w+)/i);
        if (positionMatch) {
            const position = positionMatch[1];
            return `SELECT * FROM ${tableName} WHERE position = '${position}' LIMIT 10;`;
        }
    }
    
    if (input.includes('players older than') || input.includes('players over')) {
        const ageMatch = input.match(/(?:older than|over)\s+(\d+)/i);
        if (ageMatch) {
            const age = ageMatch[1];
            return `SELECT * FROM ${tableName} WHERE age > ${age} LIMIT 10;`;
        }
    }
    
    if (input.includes('players younger than') || input.includes('players under')) {
        const ageMatch = input.match(/(?:younger than|under)\s+(\d+)/i);
        if (ageMatch) {
            const age = ageMatch[1];
            return `SELECT * FROM ${tableName} WHERE age < ${age} LIMIT 10;`;
        }
    }
    
    // Handle player value queries
    if (input.includes('players whose value is') || input.includes('players with value')) {
        const valueMatch = input.match(/(?:value is|value)\s+(?:more than|greater than|over|above)\s+(\d+)/i);
        if (valueMatch) {
            const value = valueMatch[1];
            return `SELECT * FROM ${tableName} WHERE player_value > ${value} LIMIT 10;`;
        }
        
        const valueMatch2 = input.match(/(?:value is|value)\s+(?:less than|below|under)\s+(\d+)/i);
        if (valueMatch2) {
            const value = valueMatch2[1];
            return `SELECT * FROM ${tableName} WHERE player_value < ${value} LIMIT 10;`;
        }
    }
    
    // Handle age-filtered count queries
    if (input.includes('players above age') || input.includes('players older than') || input.includes('players over')) {
        const ageMatch = input.match(/(?:above age|older than|over)\s+(\d+)/i);
        if (ageMatch) {
            const age = ageMatch[1];
            return `SELECT COUNT(*) as total_players FROM ${tableName} WHERE age > ${age};`;
        }
    }
    
    if (input.includes('players below age') || input.includes('players younger than') || input.includes('players under')) {
        const ageMatch = input.match(/(?:below age|younger than|under)\s+(\d+)/i);
        if (ageMatch) {
            const age = ageMatch[1];
            return `SELECT COUNT(*) as total_players FROM ${tableName} WHERE age < ${age};`;
        }
    }
    
    // Additional fallback for goalkeeper queries
    if (input.includes('goalkeepers') && (input.includes('play for') || input.includes('at'))) {
        const clubMatch = input.match(/(?:play for|plays for|at)\s+(\w+)/i);
        if (clubMatch) {
            const club = clubMatch[1];
            if (input.includes('how many') || input.includes('count')) {
                return `SELECT COUNT(*) as total_goalkeepers FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE ps.club = '${club}' AND p.position_name = 'GK';`;
            } else {
                return `SELECT ps.name, ps.club, ps.age, p.position_name FROM playerstats ps JOIN playerpositions pp ON ps.player_id = pp.player_id JOIN positions p ON pp.position_id = p.position_id WHERE ps.club = '${club}' AND p.position_name = 'GK' LIMIT 10;`;
            }
        }
    }
    
    // Handle combined country and club queries
    if (input.includes('players from') && input.includes('who play for')) {
        const countryMatch = input.match(/players from\s+(\w+)\s+who play for\s+(\w+)/i);
        if (countryMatch) {
            const country = countryMatch[1];
            const club = countryMatch[2];
            return `SELECT * FROM ${tableName} WHERE country = '${country}' AND club = '${club}' LIMIT 10;`;
        }
    }
    
    // Handle combined country and position queries
    if (input.includes('players from') && input.includes('who are')) {
        const countryMatch = input.match(/players from\s+(\w+)\s+who are\s+(\w+)/i);
        if (countryMatch) {
            const country = countryMatch[1];
            const position = countryMatch[2];
            return `SELECT * FROM ${tableName} WHERE country = '${country}' AND position = '${position}' LIMIT 10;`;
        }
    }
    
    // Default fallback
    throw new Error('Unable to convert natural language to SQL. Try phrases like "show all players", "count players", "show nationalities", "how many goalkeepers play for chelsea", etc.');
}

// Function to generate natural language interpretation of SQL results
function generateNaturalLanguageSummary(sqlQuery, results, rowCount) {
    const query = sqlQuery.toLowerCase().trim();
    let summary = '';
    
    console.log('NL Summary - Query:', query); // Debug
    console.log('NL Summary - Results count:', results.length); // Debug
    console.log('NL Summary - RowCount:', rowCount); // Debug
    
    if (query.includes('count') && query.includes('players')) {
        if (results.length > 0 && results[0].total_players) {
            summary = `Found ${results[0].total_players} players in the database.`;
        }
    } else if (query.includes('show tables') || query.includes('list tables')) {
        summary = `Found ${rowCount} tables in the database: ${results.map(row => Object.values(row)[0]).join(', ')}.`;
    } else if (query.includes('distinct') && (query.includes('nationality') || query.includes('country'))) {
        summary = `Found ${rowCount} different nationalities: ${results.slice(0, 5).map(row => Object.values(row)[0]).join(', ')}${rowCount > 5 ? '...' : ''}.`;
    } else if (query.includes('distinct') && query.includes('club')) {
        summary = `Found ${rowCount} different clubs: ${results.slice(0, 5).map(row => Object.values(row)[0]).join(', ')}${rowCount > 5 ? '...' : ''}.`;
    } else if (query.includes('distinct') && query.includes('position')) {
        summary = `Found ${rowCount} different positions: ${results.slice(0, 5).map(row => Object.values(row)[0]).join(', ')}${rowCount > 5 ? '...' : ''}.`;
    } else if (query.includes('avg') && query.includes('age')) {
        if (results.length > 0 && results[0].average_age) {
            summary = `The average player age is ${results[0].average_age.toFixed(1)} years.`;
        }
    } else if (query.includes('order by') && query.includes('desc') && query.includes('overall_rating')) {
        summary = `Showing the top ${Math.min(rowCount, 10)} players by overall rating.`;
        if (results.length > 0 && results[0].name) {
            summary += ` The highest rated player is ${results[0].name} with a rating of ${results[0].overall_rating}.`;
        }
    } else if (query.includes('order by') && query.includes('asc') && query.includes('age')) {
        summary = `Showing the ${Math.min(rowCount, 10)} youngest players.`;
        if (results.length > 0 && results[0].name && results[0].age) {
            summary += ` The youngest player is ${results[0].name} at ${results[0].age} years old.`;
        }
    } else if (query.includes('order by') && query.includes('desc') && query.includes('age')) {
        summary = `Showing the ${Math.min(rowCount, 10)} oldest players.`;
        if (results.length > 0 && results[0].name && results[0].age) {
            summary += ` The oldest player is ${results[0].name} at ${results[0].age} years old.`;
        }
    } else if (query.includes('where') && (query.includes('nationality') || query.includes('country'))) {
        const nationalityMatch = query.match(/nationality\s*=\s*'([^']+)'/i);
        const countryMatch = query.match(/country\s*=\s*'([^']+)'/i);
        const location = nationalityMatch ? nationalityMatch[1] : (countryMatch ? countryMatch[1] : null);
        if (location) {
            summary = `Found ${rowCount} players from ${location}.`;
        }
    } else if (query.includes('where') && query.includes('club')) {
        const match = query.match(/club\s*=\s*'([^']+)'/i);
        if (match) {
            const club = match[1];
            if (query.includes('position') && query.includes('GK')) {
                if (results.length > 0 && results[0].total_goalkeepers) {
                    summary = `Found ${results[0].total_goalkeepers} goalkeepers who play for ${club}.`;
                }
            } else if (query.includes('count')) {
                if (results.length > 0 && results[0].total_players) {
                    summary = `Found ${results[0].total_players} players who play for ${club}.`;
                }
            } else {
                summary = `Found ${rowCount} players from ${club}.`;
            }
        }
    } else if (query.includes('where') && query.includes('position') && query.includes('GK')) {
        if (results.length > 0 && results[0].total_goalkeepers) {
            summary = `Found ${results[0].total_goalkeepers} goalkeepers in the database.`;
        }
    } else if (query.includes('where') && query.includes('position')) {
        const positionMatch = query.match(/position\s*=\s*'([^']+)'/i);
        if (positionMatch) {
            const position = positionMatch[1];
            summary = `Found ${rowCount} players with position ${position}.`;
        }
    } else if (query.includes('where') && query.includes('age >')) {
        const match = query.match(/age\s*>\s*(\d+)/i);
        if (match) {
            const age = match[1];
            summary = `Found ${rowCount} players older than ${age} years.`;
        }
    } else if (query.includes('where') && query.includes('age <')) {
        const match = query.match(/age\s*<\s*(\d+)/i);
        if (match) {
            const age = match[1];
            summary = `Found ${rowCount} players younger than ${age} years.`;
        }
    } else if (query.includes('select *') && query.includes('players')) {
        summary = `Showing ${rowCount} players${query.includes('limit') ? ' (limited result)' : ''}.`;
        if (results.length > 0 && results[0].name) {
            summary += ` First player: ${results[0].name}.`;
        }
    } else {
        summary = `Query returned ${rowCount} row${rowCount !== 1 ? 's' : ''}.`;
    }
    
    return summary;
}

// API route to execute SQL queries
app.post('/api/query', async (req, res) => {
    const { query } = req.body;
    
    if (!query) {
        return res.status(400).json({ error: 'No SQL query provided' });
    }
    
    // Basic security check - only allow SELECT queries
    const trimmedQuery = query.trim().toLowerCase();
    console.log('Executing query:', query); // Debug
    console.log('Trimmed query:', trimmedQuery); // Debug
    console.log('Query type check - includes goalkeepers:', query.includes('goalkeepers')); // Debug
    console.log('Query type check - includes count:', query.includes('count')); // Debug
    if (!trimmedQuery.startsWith('select') && !trimmedQuery.startsWith('show') && !trimmedQuery.startsWith('describe')) {
        return res.status(400).json({ error: 'Only SELECT, SHOW, and DESCRIBE queries are allowed' });
    }
    
    // Query execution using PKL data
console.log('Executing query:', query); // Debug
console.log('Trimmed query:', trimmedQuery); // Debug

try {
    let results = [];
    let rowCount = 0;
    
    // Handle SELECT queries on PKL data
    if (trimmedQuery.startsWith('select')) {
        // Parse SELECT query and filter PKL data
        results = filterPlayerData(query, playerData);
        rowCount = results.length;
        
        console.log('PKL Query Results:', results); // Debug
        console.log('PKL Results Length:', results.length); // Debug
        
        // Generate natural language summary
        const nlSummary = generateNaturalLanguageSummary(query, results, rowCount);
        
        res.json({
            success: true,
            data: results,
            rowCount: rowCount,
            nlSummary: nlSummary
        });
    } else {
        // Handle non-SELECT queries (SHOW, DESCRIBE, etc.)
        return res.status(400).json({ 
            error: 'PKL mode only supports SELECT queries. Use queries like "show all players", "show players from chelsea", etc.' 
        });
    }
} catch (error) {
    console.error('Query Error:', error);
    return res.status(500).json({ error: error.message });
}

// Function to filter PKL data based on SQL query
function filterPlayerData(query, data) {
    const lowerQuery = query.toLowerCase();
    
    // Handle different SELECT patterns
    if (lowerQuery.includes('show all') || lowerQuery.includes('select *')) {
        return data;
    }
    
    // Handle WHERE clauses
    if (lowerQuery.includes('where')) {
        return filterByWhereClause(query, data);
    }
    
    // Handle country filters
    if (lowerQuery.includes('country') && lowerQuery.includes('=')) {
        const country = extractValue(query, 'country');
        return data.filter(player => player.country.toLowerCase() === country.toLowerCase());
    }
    
    // Handle club filters
    if (lowerQuery.includes('club') && lowerQuery.includes('=')) {
        const club = extractValue(query, 'club');
        return data.filter(player => player.club.toLowerCase() === club.toLowerCase());
    }
    
    // Handle position filters
    if (lowerQuery.includes('position') && lowerQuery.includes('=')) {
        const position = extractValue(query, 'position');
        return data.filter(player => player.position && player.position.toLowerCase() === position.toLowerCase());
    }
    
    // Handle age filters
    if (lowerQuery.includes('age') && (lowerQuery.includes('>') || lowerQuery.includes('<'))) {
        return filterByAge(query, data);
    }
    
    // Handle value filters
    if (lowerQuery.includes('player_value') && (lowerQuery.includes('>') || lowerQuery.includes('<'))) {
        return filterByValue(query, data);
    }
    
    // Handle combined filters
    if (lowerQuery.includes('and')) {
        return filterByMultipleConditions(query, data);
    }
    
    return data; // Default: return all data
}

// Helper functions for filtering
function extractValue(query, field) {
    const match = query.match(new RegExp(`${field}\\s*=\\s*['\\"]([^'\\"]+)['\\"]`, 'i'));
    return match ? match[1] : null;
}

function filterByWhereClause(query, data) {
    // Simple WHERE clause parsing - can be enhanced
    return data; // For now, return all data
}

function filterByAge(query, data) {
    const ageMatch = query.match(/age\\s*[><=]\\s*(\\d+)/i);
    if (!ageMatch) return data;
    
    const age = parseInt(ageMatch[1]);
    const operator = query.includes('>') ? '>' : '<';
    
    return data.filter(player => {
        if (operator === '>') return player.age > age;
        else return player.age < age;
    });
}

function filterByValue(query, data) {
    const valueMatch = query.match(/player_value\\s*[><=]\\s*(\\d+)/i);
    if (!valueMatch) return data;
    
    const value = parseInt(valueMatch[1]);
    const operator = query.includes('>') ? '>' : '<';
    
    return data.filter(player => {
        if (operator === '>') return player.player_value > value;
        else return player.player_value < value;
    });
}

function filterByMultipleConditions(query, data) {
    // Handle complex queries with multiple conditions
    let filtered = [...data];
    
    // Country + Club
    if (query.includes('country') && query.includes('club')) {
        const country = extractValue(query, 'country');
        const club = extractValue(query, 'club');
        filtered = filtered.filter(player => 
            player.country.toLowerCase() === country.toLowerCase() && 
            player.club.toLowerCase() === club.toLowerCase()
        );
    }
    
    // Country + Value
    if (query.includes('country') && query.includes('player_value')) {
        const country = extractValue(query, 'country');
        const value = extractValue(query, 'player_value');
        const operator = query.includes('>') ? '>' : '<';
        const numValue = parseInt(value);
        
        filtered = filtered.filter(player => 
            player.country.toLowerCase() === country.toLowerCase() && 
            (operator === '>' ? player.player_value > numValue : player.player_value < numValue)
        );
    }
    
    // Club + Value
    if (query.includes('club') && query.includes('player_value')) {
        const club = extractValue(query, 'club');
        const value = extractValue(query, 'player_value');
        const operator = query.includes('>') ? '>' : '<';
        const numValue = parseInt(value);
        
        filtered = filtered.filter(player => 
            player.club.toLowerCase() === club.toLowerCase() && 
            (operator === '>' ? player.player_value > numValue : player.player_value < numValue)
        );
    }
    
    return filtered;
}
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        if (process.env.DB_TYPE === 'postgres') {
            const result = await db.query('SELECT NOW() as current_time');
            res.json({
                status: 'healthy',
                database: 'PostgreSQL',
                time: result.rows[0].current_time,
                env_vars: {
                    DB_TYPE: process.env.DB_TYPE,
                    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
                }
            });
        } else {
            res.json({
                status: 'healthy',
                database: 'MySQL',
                env_vars: {
                    DB_TYPE: process.env.DB_TYPE || 'NOT SET',
                    DB_HOST: process.env.DB_HOST || 'NOT SET'
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            env_vars: {
                DB_TYPE: process.env.DB_TYPE || 'NOT SET',
                DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
            }
        });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`FIFA SQL Terminal running at http://localhost:${port}`);
});