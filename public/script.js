document.addEventListener('DOMContentLoaded', function() {
    const sqlQuery = document.getElementById('sqlQuery');
    const runButton = document.getElementById('runQuery');
    const convertBtn = document.getElementById('convertBtn');
    const output = document.getElementById('output');
    const prompt = document.getElementById('prompt');
    const sqlMode = document.getElementById('sqlMode');
    const nlMode = document.getElementById('nlMode');
    
    let currentMode = 'sql'; // 'sql' or 'nl'

    // Focus on the textarea when page loads
    sqlQuery.focus();

    // Mode toggle functionality
    sqlMode.addEventListener('click', () => switchMode('sql'));
    nlMode.addEventListener('click', () => switchMode('nl'));

    // Run query when button is clicked
    runButton.addEventListener('click', executeQuery);

    // Convert natural language to SQL
    convertBtn.addEventListener('click', convertToSQL);

    // Run query when Ctrl+Enter is pressed in the textarea
    sqlQuery.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (currentMode === 'nl') {
                convertToSQL();
            } else {
                executeQuery();
            }
        }
    });

    function switchMode(mode) {
        currentMode = mode;
        
        if (mode === 'sql') {
            sqlMode.classList.add('active');
            nlMode.classList.remove('active');
            sqlQuery.placeholder = 'Enter your SQL query here...';
            prompt.textContent = 'fifa-sql>';
            runButton.style.display = 'block';
            convertBtn.style.display = 'none';
        } else {
            sqlMode.classList.remove('active');
            nlMode.classList.add('active');
            sqlQuery.placeholder = 'Ask a question about your FIFA data in natural language...';
            prompt.textContent = 'fifa-nl>';
            runButton.style.display = 'none';
            convertBtn.style.display = 'block';
        }
        
        sqlQuery.focus();
    }

    async function executeQuery() {
        const query = sqlQuery.value.trim();
        
        if (!query) {
            showOutput('Please enter a SQL query.', 'error');
            return;
        }

        // Show loading state
        showOutput('Executing query...', 'loading');
        runButton.disabled = true;
        runButton.textContent = 'Running...';

        try {
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: query })
            });

            const result = await response.json();

            if (response.ok) {
                if (result.data && result.data.length > 0) {
                    displayResults(result.data, result.rowCount, result.nlSummary);
                } else {
                    const summary = result.nlSummary || 'Query executed successfully. No results returned.';
                    showOutput(summary, 'success');
                }
            } else {
                showOutput(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            showOutput(`Network error: ${error.message}`, 'error');
        } finally {
            runButton.disabled = false;
            runButton.textContent = 'Run Query';
        }
    }

    function displayResults(data, rowCount, nlSummary) {
        let html = '';
        
        // Show natural language summary if available
        if (nlSummary) {
            html += `<div class="nl-summary">${escapeHtml(nlSummary)}</div>`;
        }
        
        if (Array.isArray(data) && data.length > 0) {
            // Create table
            html += '<table class="table">';
            
            // Table headers
            const headers = Object.keys(data[0]);
            html += '<thead><tr>';
            headers.forEach(header => {
                html += `<th>${escapeHtml(header)}</th>`;
            });
            html += '</tr></thead>';
            
            // Table rows
            html += '<tbody>';
            data.forEach(row => {
                html += '<tr>';
                headers.forEach(header => {
                    const value = row[header];
                    const displayValue = value === null ? 'NULL' : 
                                       value === undefined ? '' : 
                                       String(value);
                    html += `<td>${escapeHtml(displayValue)}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table>';
            
            // Row count
            html += `<div class="row-count">${rowCount} row(s) returned</div>`;
        } else {
            html = '<div class="success">Query executed successfully.</div>';
        }
        
        showOutput(html, 'success');
    }

    function showOutput(content, type = '') {
        output.innerHTML = content;
        output.className = 'output-content';
        if (type) {
            output.classList.add(type);
        }
        
        // Scroll to bottom of output
        output.scrollTop = output.scrollHeight;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async function convertToSQL() {
        const naturalLanguage = sqlQuery.value.trim();
        
        if (!naturalLanguage) {
            showOutput('Please enter a natural language query.', 'error');
            return;
        }

        // Show loading state
        showOutput('Converting to SQL...', 'loading');
        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';

        try {
            const response = await fetch('/api/nl-to-sql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ naturalLanguage: naturalLanguage })
            });

            const result = await response.json();

            if (response.ok) {
                // Show the generated SQL
                showOutput(
                    '<div class="success">Natural Language:</div>' +
                    `<div style="margin: 5px 0; color: #00cc00;">${escapeHtml(result.naturalLanguage)}</div>` +
                    '<div class="success">Generated SQL:</div>' +
                    `<div class="sql-output">${escapeHtml(result.sqlQuery)}</div>` +
                    '<div style="margin-top: 10px;">' +
                    '<button onclick="executeGeneratedQuery()" style="background-color: #00ff00; color: #000; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Execute This Query</button>' +
                    '</div>',
                    'success'
                );
                
                // Store the generated SQL for execution
                window.generatedSQL = result.sqlQuery;
            } else {
                showOutput(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            showOutput(`Network error: ${error.message}`, 'error');
        } finally {
            convertBtn.disabled = false;
            convertBtn.textContent = 'Convert to SQL';
        }
    }

    // Function to execute the generated SQL query
    window.executeGeneratedQuery = function() {
        if (window.generatedSQL) {
            sqlQuery.value = window.generatedSQL;
            switchMode('sql');
            executeQuery();
        }
    };

    // Add some sample queries for demonstration
    const sampleQueries = [
        '-- Try these sample queries:',
        'SHOW TABLES;',
        'SELECT * FROM players LIMIT 10;',
        'SELECT COUNT(*) as total_players FROM players;',
        'SELECT DISTINCT nationality FROM players ORDER BY nationality;'
    ];

    const nlExamples = [
        'Try these natural language examples:',
        'show all players',
        'count players', 
        'show nationalities',
        'best players',
        'youngest players',
        'players older than 30',
        'players from Brazil',
        'show clubs'
    ];

    // Show welcome message
    showOutput(
        '<div class="success">Welcome to FIFA SQL Terminal!</div>' +
        '<div style="margin-top: 10px;">Choose between SQL Mode and Natural Language mode above.</div>' +
        '<div style="margin-top: 10px; font-size: 12px; color: #00cc00;">SQL Sample queries:</div>' +
        '<div style="margin-top: 5px; font-size: 11px; color: #00aa00;">' +
        sampleQueries.map(q => `<div>${escapeHtml(q)}</div>`).join('') +
        '</div>' +
        '<div style="margin-top: 15px; font-size: 12px; color: #ffaa00;">Natural Language examples:</div>' +
        '<div class="nl-examples">' +
        nlExamples.map(q => `<div>${escapeHtml(q)}</div>`).join('') +
        '</div>',
        'success'
    );
});