class APITester {
    constructor() {
        this.endpoints = new Map();
        this.currentEndpoint = null;
        this.chart = null;
        this.darkMode = false;

        this.initializeUI();
        this.setupEventListeners();
        this.initializeChart();
    }

    initializeUI() {
        // Initialize theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) this.toggleTheme();

        // Add some sample endpoints
        this.addSampleEndpoints();
    }

    setupEventListeners() {
        // Theme toggle
        document.querySelector('.theme-toggle').addEventListener('click', () => this.toggleTheme());

        // Add endpoint button
        document.getElementById('addEndpoint').addEventListener('click', () => this.showAddEndpointModal());

        // Send request button
        document.getElementById('sendRequest').addEventListener('click', () => this.sendRequest());

        // Save endpoint button
        document.getElementById('saveEndpoint').addEventListener('click', () => this.saveEndpoint());

        // Modal actions
        document.getElementById('createEndpoint').addEventListener('click', () => this.createEndpoint());
        document.getElementById('cancelCreate').addEventListener('click', () => this.hideAddEndpointModal());

        // Response tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e));
        });

        // Test all button
        document.getElementById('testAll').addEventListener('click', () => this.testAllEndpoints());

        // Export results button
        document.getElementById('exportResults').addEventListener('click', () => this.exportResults());
    }

    initializeChart() {
        const ctx = document.getElementById('performanceChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Response Time (ms)',
                    data: this.generateRandomData(24),
                    borderColor: '#6366f1',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: this.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: this.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    toggleTheme() {
        this.darkMode = !this.darkMode;
        document.body.classList.toggle('dark-theme');
        const icon = document.querySelector('.theme-toggle i');
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');

        // Update chart theme
        if (this.chart) {
            this.chart.options.scales.y.grid.color = this.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            this.chart.options.scales.x.grid.color = this.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            this.chart.update();
        }
    }

    addSampleEndpoints() {
        const sampleEndpoints = [
            { name: 'Get Users', method: 'GET', url: 'https://api.example.com/users' },
            { name: 'Create User', method: 'POST', url: 'https://api.example.com/users' },
            { name: 'Update User', method: 'PUT', url: 'https://api.example.com/users/1' },
            { name: 'Delete User', method: 'DELETE', url: 'https://api.example.com/users/1' }
        ];

        sampleEndpoints.forEach(endpoint => {
            this.endpoints.set(endpoint.name, endpoint);
            this.addEndpointToList(endpoint);
        });
    }

    addEndpointToList(endpoint) {
        const endpointsList = document.getElementById('endpointsList');
        const endpointElement = document.createElement('div');
        endpointElement.className = 'endpoint-item';
        endpointElement.innerHTML = `
            <div class="endpoint-info">
                <span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                <span class="name">${endpoint.name}</span>
            </div>
            <div class="endpoint-actions">
                <button class="btn-icon edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        endpointElement.addEventListener('click', () => this.loadEndpoint(endpoint));
        endpointsList.appendChild(endpointElement);
    }

    showAddEndpointModal() {
        const modal = document.getElementById('addEndpointModal');
        modal.classList.add('active');
    }

    hideAddEndpointModal() {
        const modal = document.getElementById('addEndpointModal');
        modal.classList.remove('active');
    }

    createEndpoint() {
        const name = document.getElementById('endpointName').value;
        const method = document.getElementById('newHttpMethod').value;
        const url = document.getElementById('newEndpointUrl').value;

        if (!name || !url) {
            alert('Please fill in all fields');
            return;
        }

        const endpoint = { name, method, url };
        this.endpoints.set(name, endpoint);
        this.addEndpointToList(endpoint);
        this.hideAddEndpointModal();

        // Clear form
        document.getElementById('endpointName').value = '';
        document.getElementById('newEndpointUrl').value = '';
    }

    loadEndpoint(endpoint) {
        this.currentEndpoint = endpoint;
        
        // Update form fields
        document.getElementById('httpMethod').value = endpoint.method;
        document.getElementById('endpointUrl').value = endpoint.url;
    }

    async sendRequest() {
        const method = document.getElementById('httpMethod').value;
        const url = document.getElementById('endpointUrl').value;
        const headers = JSON.parse(document.getElementById('headersEditor').innerText);
        const body = method !== 'GET' ? JSON.parse(document.getElementById('requestBody').innerText) : null;

        try {
            const startTime = performance.now();
            const response = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
            });
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);

            const data = await response.json();
            this.updateResponsePanel(response.status, responseTime, data);
            this.updateMetrics(response.status, responseTime);
        } catch (error) {
            this.showError(error);
        }
    }

    updateResponsePanel(status, time, data) {
        const statusElement = document.querySelector('.status');
        const timeElement = document.querySelector('.time');
        const responseBody = document.getElementById('responseBody');

        statusElement.textContent = `${status} ${this.getStatusText(status)}`;
        statusElement.className = `status ${this.getStatusClass(status)}`;
        timeElement.textContent = `${time}ms`;
        responseBody.innerHTML = `<pre><code class="language-json">${JSON.stringify(data, null, 2)}</code></pre>`;
    }

    getStatusText(status) {
        const statusTexts = {
            200: 'OK',
            201: 'Created',
            400: 'Bad Request',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not Found',
            500: 'Internal Server Error'
        };
        return statusTexts[status] || 'Unknown';
    }

    getStatusClass(status) {
        if (status >= 200 && status < 300) return 'success';
        if (status >= 400 && status < 500) return 'warning';
        return 'danger';
    }

    updateMetrics(status, time) {
        // Update success rate
        const successRate = document.getElementById('successRate');
        const currentRate = parseFloat(successRate.textContent);
        const newRate = status >= 200 && status < 300 ? currentRate + 0.1 : currentRate - 0.1;
        successRate.textContent = `${Math.min(100, Math.max(0, newRate.toFixed(1)))}%`;

        // Update average response time
        const avgResponseTime = document.getElementById('avgResponseTime');
        const currentTime = parseInt(avgResponseTime.textContent);
        const newTime = Math.round((currentTime + time) / 2);
        avgResponseTime.textContent = `${newTime}ms`;

        // Update chart
        this.updateChart(time);
    }

    updateChart(newDataPoint) {
        const data = this.chart.data.datasets[0].data;
        data.shift();
        data.push(newDataPoint);
        this.chart.update();
    }

    generateRandomData(count) {
        return Array.from({length: count}, () => Math.floor(Math.random() * 300) + 100);
    }

    switchTab(event) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    }

    async testAllEndpoints() {
        const results = [];
        for (const endpoint of this.endpoints.values()) {
            try {
                const startTime = performance.now();
                const response = await fetch(endpoint.url, { method: endpoint.method });
                const endTime = performance.now();
                results.push({
                    name: endpoint.name,
                    status: response.status,
                    time: Math.round(endTime - startTime)
                });
            } catch (error) {
                results.push({
                    name: endpoint.name,
                    status: 'Error',
                    error: error.message
                });
            }
        }
        this.showTestResults(results);
    }

    showTestResults(results) {
        const successCount = results.filter(r => r.status >= 200 && r.status < 300).length;
        const totalCount = results.length;
        const successRate = ((successCount / totalCount) * 100).toFixed(1);
        
        document.getElementById('successRate').textContent = `${successRate}%`;
        // Update other metrics based on results
    }

    exportResults() {
        const results = {
            endpoints: Array.from(this.endpoints.values()),
            metrics: {
                successRate: document.getElementById('successRate').textContent,
                avgResponseTime: document.getElementById('avgResponseTime').textContent,
                activeEndpoints: document.getElementById('activeEndpoints').textContent
            }
        };

        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'api-test-results.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showError(error) {
        const responseBody = document.getElementById('responseBody');
        responseBody.innerHTML = `<pre class="error">${error.message}</pre>`;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new APITester();
});