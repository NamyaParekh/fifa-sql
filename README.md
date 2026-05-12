# FIFA SQL Terminal

A web-based SQL terminal with a black terminal UI and neon green text for querying FIFA databases.

## Features

- **Terminal-style UI**: Black background with neon green text
- **SQL Query Interface**: Textarea for writing SQL queries
- **Real-time Results**: Display query results in a formatted table
- **Keyboard Shortcuts**: Press Ctrl+Enter to execute queries
- **Security**: Only allows SELECT, SHOW, and DESCRIBE queries

## Requirements

- Node.js (v14 or higher)
- MySQL Server
- A FIFA database named "fifa"

## Installation

1. **Install Node.js**: Download and install Node.js from [nodejs.org](https://nodejs.org/)

2. **Install MySQL**: Download and install MySQL Server from [dev.mysql.com](https://dev.mysql.com/)

3. **Create Database**: Create a MySQL database named "fifa" and import your FIFA data

4. **Install Dependencies**:
   ```bash
   npm install
   ```

5. **Configure Database**: Update the MySQL connection settings in `server.js` if needed:
   ```javascript
   const db = mysql.createConnection({
       host: 'localhost',
       user: 'root',
       password: 'your_password', // Update this
       database: 'fifa'
   });
   ```

## Usage

1. **Start the Server**:
   ```bash
   npm start
   ```

2. **Open Browser**: Navigate to [http://localhost:3000](http://localhost:3000)

3. **Run Queries**: 
   - Type SQL queries in the textarea
   - Click "Run Query" or press Ctrl+Enter
   - View results in the output area

## Sample Queries

```sql
-- Show all tables
SHOW TABLES;

-- Get first 10 players
SELECT * FROM players LIMIT 10;

-- Count total players
SELECT COUNT(*) as total_players FROM players;

-- Get distinct nationalities
SELECT DISTINCT nationality FROM players ORDER BY nationality;
```

## Project Structure

```
fifa-sql-terminal/
├── server.js              # Express server with MySQL connection
├── package.json           # Node.js dependencies
├── public/
│   ├── index.html         # Main HTML page
│   ├── style.css          # Terminal styling
│   └── script.js          # Frontend JavaScript
└── README.md              # This file
```

## Security Notes

- Only SELECT, SHOW, and DESCRIBE queries are allowed for security
- Input validation is implemented on both client and server side
- SQL injection protection through parameterized queries

## Dependencies

- **express**: Web framework for Node.js
- **mysql2**: MySQL driver for Node.js
- **cors**: Cross-Origin Resource Sharing middleware

## License

ISC
